import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import { afterAll, describe, expect, it } from 'vitest'

import { ApiLive } from '../layers/api-live'

const runtime = ManagedRuntime.make(PgLiteSqlClientLayer({ withAllMigrations: true }))
const sql = await runtime.runPromise(SqlClient.SqlClient)

const { dispose, handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(Layer.provide(Layer.succeed(SqlClient.SqlClient, sql)))
)

afterAll(async () => {
  await dispose()
  await runtime.dispose()
})

const FORGE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LYON = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const UNKNOWN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

interface Slot {
  readonly startAt: string
  readonly endAt: string
  readonly available: boolean
  readonly reason: string
}

interface Availability {
  readonly machineName: string
  readonly machineStatus: string
  readonly slotDurationMinutes: number
  readonly from: string
  readonly to: string
  readonly slots: ReadonlyArray<Slot>
}

const send = (method: string, path: string, body?: unknown, token?: string) =>
  handler(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  )

const seedAtelier = (id: string, slug: string) =>
  runtime.runPromise(
    sql`
      INSERT INTO ateliers (id, slug, name, description, city, latitude, longitude, status)
      VALUES (${id}, ${slug}, ${slug}, 'Un atelier partagé', 'Montreuil', 48.8638, 2.4485, 'PUBLISHED')
    `
  )

await seedAtelier(FORGE, 'la-forge')
await seedAtelier(LYON, 'lyon')

const join = async (atelierId: string, role: 'MEMBER' | 'FABMANAGER'): Promise<string> => {
  const registration = await send('POST', '/auth/register', {
    email: `booking-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const { token, user } = (await registration.json()) as { token: string; user: { id: string } }
  await runtime.runPromise(
    sql`
      INSERT INTO memberships (id, user_id, atelier_id, role, status)
      VALUES (${globalThis.crypto.randomUUID()}, ${user.id}, ${atelierId}, ${role}, 'ACTIVE')
    `
  )
  return token
}

interface MachineOptions {
  readonly slotDurationMinutes?: number
  readonly requiresCertification?: boolean
  readonly nfcTagId?: string
}

const createMachine = async (
  atelierId: string,
  name: string,
  options: MachineOptions = {}
): Promise<{ readonly id: string; readonly fabmanager: string }> => {
  const fabmanager = await join(atelierId, 'FABMANAGER')
  const response = await send(
    'POST',
    '/manage/machines',
    { atelierId, name, kind: 'LASER_CUTTER', slotDurationMinutes: 60, ...options },
    fabmanager
  )
  const { id } = (await response.json()) as { id: string }
  return { id, fabmanager }
}

const addMachine = async (atelierId: string, name: string, slotDurationMinutes = 60): Promise<string> =>
  (await createMachine(atelierId, name, { slotDurationMinutes })).id

const availability = (machineId: string, token?: string, query = '') =>
  send('GET', `/machines/${machineId}/availability${query}`, undefined, token)

describe('GET /machines/:id/availability', () => {
  it('opens a week of slots on a machine of the atelier the member joined', async () => {
    const machineId = await addMachine(FORGE, 'Trotec', 120)
    const member = await join(FORGE, 'MEMBER')

    const response = await availability(machineId, member)
    expect(response.status).toBe(200)

    const body = (await response.json()) as Availability
    expect(body.machineName).toBe('Trotec')
    expect(body.machineStatus).toBe('AVAILABLE')
    expect(body.slotDurationMinutes).toBe(120)
    expect(body.slots).toHaveLength(7 * 7)
  })

  it('starts the week on the day asked for', async () => {
    const machineId = await addMachine(FORGE, 'Prusa')
    const member = await join(FORGE, 'MEMBER')

    const response = await availability(machineId, member, '?from=2026-04-10T09:00:00.000Z')
    expect(response.status).toBe(200)

    const body = (await response.json()) as Availability
    expect(body.from).toBe('2026-04-09T22:00:00.000Z')
    expect(body.to).toBe('2026-04-16T22:00:00.000Z')
  })

  it('closes the slot a confirmed booking already holds', async () => {
    const machineId = await addMachine(FORGE, 'Zund')
    const member = await join(FORGE, 'MEMBER')
    const booked = await runtime.runPromise(
      sql<{
        start_at: Date
      }>`
        INSERT INTO bookings (id, machine_id, atelier_id, user_id, start_at, end_at)
        SELECT ${globalThis.crypto.randomUUID()}, ${machineId}, ${FORGE}, users.id,
               date_trunc('day', now() AT TIME ZONE 'Europe/Paris' + interval '1 day') AT TIME ZONE 'Europe/Paris' + interval '9 hours',
               date_trunc('day', now() AT TIME ZONE 'Europe/Paris' + interval '1 day') AT TIME ZONE 'Europe/Paris' + interval '10 hours'
        FROM users ORDER BY created_at DESC LIMIT 1
        RETURNING start_at
      `
    )

    const response = await availability(machineId, member)
    const body = (await response.json()) as Availability
    const taken = body.slots.filter((slot) => slot.reason === 'BOOKED')

    expect(booked).toHaveLength(1)
    expect(taken).toHaveLength(1)
    expect(taken[0]?.available).toBe(false)
  })

  it('answers 404 on a machine of an atelier the member never joined', async () => {
    const machineId = await addMachine(FORGE, 'Hors de portée')
    const stranger = await join(LYON, 'MEMBER')

    expect((await availability(machineId, stranger)).status).toBe(404)
  })

  it('answers 404 on a machine that does not exist', async () => {
    const member = await join(FORGE, 'MEMBER')

    expect((await availability(UNKNOWN, member)).status).toBe(404)
  })

  it('answers 401 without a token', async () => {
    const machineId = await addMachine(FORGE, 'Anonyme')

    expect((await availability(machineId)).status).toBe(401)
  })
})

interface BookingDetail {
  readonly id: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly startAt: string
  readonly endAt: string
  readonly status: string
  readonly checkedInAt: string | null
  readonly canCancel: boolean
  readonly canCheckIn: boolean
}

const firstFreeSlot = async (machineId: string, token: string): Promise<Slot> => {
  const body = (await (await availability(machineId, token)).json()) as Availability
  const free = body.slots.find((slot) => slot.reason === 'FREE')
  if (free === undefined) throw new Error('the machine offers no free slot')
  return free
}

const book = (payload: unknown, token?: string) => send('POST', '/bookings', payload, token)
const listBookings = (token: string) => send('GET', '/bookings', undefined, token)
const readBooking = (id: string, token: string) => send('GET', `/bookings/${id}`, undefined, token)
const cancelBooking = (id: string, token: string) => send('POST', `/bookings/${id}/cancel`, undefined, token)
const checkIn = (id: string, payload: unknown, token?: string) =>
  send('POST', `/bookings/${id}/check-in`, payload, token)

const grantCertification = async (machineId: string, member: string, fabmanager: string): Promise<void> => {
  const requested = await send('POST', '/certifications', { machineId }, member)
  const { id } = (await requested.json()) as { id: string }
  await send('POST', `/manage/certifications/${id}/grant`, undefined, fabmanager)
}

const bookFirstFreeSlot = async (
  machineId: string,
  token: string
): Promise<{ readonly booking: BookingDetail; readonly slot: Slot }> => {
  const slot = await firstFreeSlot(machineId, token)
  const response = await book({ machineId, startAt: slot.startAt }, token)
  return { booking: (await response.json()) as BookingDetail, slot }
}

describe('POST /bookings', () => {
  it('books a free slot on a machine open to every member', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa libre', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const slot = await firstFreeSlot(machineId, member)

    const response = await book({ machineId, startAt: slot.startAt }, member)
    expect(response.status).toBe(201)

    const body = (await response.json()) as BookingDetail
    expect(body.machineName).toBe('Prusa libre')
    expect(body.atelierSlug).toBe('la-forge')
    expect(body.status).toBe('CONFIRMED')
    expect(body.startAt).toBe(slot.startAt)
    expect(body.endAt).toBe(slot.endAt)
    expect(body.canCancel).toBe(true)
  })

  it('closes the slot it just took', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa prise', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const { slot } = await bookFirstFreeSlot(machineId, member)

    const after = (await (await availability(machineId, member)).json()) as Availability
    const taken = after.slots.find((candidate) => candidate.startAt === slot.startAt)

    expect(taken?.reason).toBe('BOOKED')
    expect(taken?.available).toBe(false)
  })

  it('refuses a slot another member already holds', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa disputée', { requiresCertification: false })
    const first = await join(FORGE, 'MEMBER')
    const second = await join(FORGE, 'MEMBER')
    const { slot } = await bookFirstFreeSlot(machineId, first)

    const response = await book({ machineId, startAt: slot.startAt }, second)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('BookingOverlapError')
  })

  it('refuses a machine that requires a certification the member does not hold', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Trotec fermée')
    const member = await join(FORGE, 'MEMBER')
    const slot = await firstFreeSlot(machineId, member)

    const response = await book({ machineId, startAt: slot.startAt }, member)
    expect(response.status).toBe(403)
    expect(((await response.json()) as { _tag: string })._tag).toBe('MissingCertificationError')
  })

  it('lets the same member through once the certification is granted', async () => {
    const { id: machineId, fabmanager } = await createMachine(FORGE, 'Trotec ouverte')
    const member = await join(FORGE, 'MEMBER')
    const slot = await firstFreeSlot(machineId, member)

    expect((await book({ machineId, startAt: slot.startAt }, member)).status).toBe(403)
    await grantCertification(machineId, member, fabmanager)

    expect((await book({ machineId, startAt: slot.startAt }, member)).status).toBe(201)
  })

  it('refuses a machine under maintenance', async () => {
    const { id: machineId, fabmanager } = await createMachine(FORGE, 'Zund en panne', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const slot = await firstFreeSlot(machineId, member)
    await send('PATCH', `/manage/machines/${machineId}`, { status: 'MAINTENANCE' }, fabmanager)

    const response = await book({ machineId, startAt: slot.startAt }, member)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('MachineUnavailableError')
  })

  it('hides a retired machine behind a 404', async () => {
    const { id: machineId, fabmanager } = await createMachine(FORGE, 'Zund retirée', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const slot = await firstFreeSlot(machineId, member)
    await send('PATCH', `/manage/machines/${machineId}`, { status: 'RETIRED' }, fabmanager)

    const response = await book({ machineId, startAt: slot.startAt }, member)
    expect(response.status).toBe(404)
    expect(((await response.json()) as { _tag: string })._tag).toBe('MachineNotBookableError')
  })

  it('refuses a slot that already went by', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa passée', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')

    const response = await book({ machineId, startAt: '2020-01-06T09:00:00.000Z' }, member)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('SlotInThePastError')
  })

  it('answers 404 on a machine of an atelier the member never joined', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa lointaine', { requiresCertification: false })
    const owner = await join(FORGE, 'MEMBER')
    const stranger = await join(LYON, 'MEMBER')
    const slot = await firstFreeSlot(machineId, owner)

    expect((await book({ machineId, startAt: slot.startAt }, stranger)).status).toBe(404)
  })

  it('answers 401 without a token', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa anonyme', { requiresCertification: false })

    expect((await book({ machineId, startAt: '2030-01-06T09:00:00.000Z' })).status).toBe(401)
  })
})

describe('GET /bookings', () => {
  it('lists the bookings of the caller and no one else', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa partagée', { requiresCertification: false })
    const mine = await join(FORGE, 'MEMBER')
    const theirs = await join(FORGE, 'MEMBER')
    const { booking } = await bookFirstFreeSlot(machineId, mine)
    await bookFirstFreeSlot(machineId, theirs)

    const response = await listBookings(mine)
    expect(response.status).toBe(200)

    const body = (await response.json()) as ReadonlyArray<BookingDetail>
    expect(body.map((entry) => entry.id)).toEqual([booking.id])
    expect(body[0]?.machineName).toBe('Prusa partagée')
  })

  it('answers 401 without a token', async () => {
    expect((await send('GET', '/bookings')).status).toBe(401)
  })
})

describe('GET /bookings/:id', () => {
  it('reads a booking of the caller, machine and atelier named', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa nommée', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const { booking } = await bookFirstFreeSlot(machineId, member)

    const response = await readBooking(booking.id, member)
    expect(response.status).toBe(200)

    const body = (await response.json()) as BookingDetail
    expect(body.machineName).toBe('Prusa nommée')
    expect(body.atelierName).toBe('la-forge')
  })

  it('answers 404 on a booking that belongs to someone else', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa privée', { requiresCertification: false })
    const owner = await join(FORGE, 'MEMBER')
    const stranger = await join(FORGE, 'MEMBER')
    const { booking } = await bookFirstFreeSlot(machineId, owner)

    expect((await readBooking(booking.id, stranger)).status).toBe(404)
  })

  it('answers 404 on a booking that does not exist', async () => {
    const member = await join(FORGE, 'MEMBER')

    expect((await readBooking(UNKNOWN, member)).status).toBe(404)
  })
})

describe('POST /bookings/:id/cancel', () => {
  it('cancels a booking of the caller and frees the slot', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa annulée', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const { booking, slot } = await bookFirstFreeSlot(machineId, member)

    const response = await cancelBooking(booking.id, member)
    expect(response.status).toBe(200)

    const body = (await response.json()) as BookingDetail
    expect(body.status).toBe('CANCELLED')
    expect(body.canCancel).toBe(false)

    const after = (await (await availability(machineId, member)).json()) as Availability
    expect(after.slots.find((candidate) => candidate.startAt === slot.startAt)?.reason).toBe('FREE')
  })

  it('refuses to cancel twice', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa têtue', { requiresCertification: false })
    const member = await join(FORGE, 'MEMBER')
    const { booking } = await bookFirstFreeSlot(machineId, member)
    await cancelBooking(booking.id, member)

    const response = await cancelBooking(booking.id, member)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('BookingNotCancellableError')
  })

  it('answers 404 when the booking belongs to someone else', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Prusa gardée', { requiresCertification: false })
    const owner = await join(FORGE, 'MEMBER')
    const stranger = await join(FORGE, 'MEMBER')
    const { booking } = await bookFirstFreeSlot(machineId, owner)

    expect((await cancelBooking(booking.id, stranger)).status).toBe(404)
  })
})

const IN_A_MINUTE = (): string => new Date(Date.now() + 60_000).toISOString()
const IN_THREE_DAYS = (): string => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

const bookAt = async (machineId: string, startAt: string, token: string): Promise<BookingDetail> => {
  const response = await book({ machineId, startAt }, token)
  expect(response.status).toBe(201)
  return (await response.json()) as BookingDetail
}

describe('POST /bookings/:id/check-in', () => {
  it('stamps the presence when the tag of the reserved machine is presented in time', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Trotec pointée', {
      requiresCertification: false,
      nfcTagId: 'nfc-trotec-pointee',
    })
    const member = await join(FORGE, 'MEMBER')
    const booking = await bookAt(machineId, IN_A_MINUTE(), member)
    expect(booking.canCheckIn).toBe(true)

    const response = await checkIn(booking.id, { nfcTagId: 'nfc-trotec-pointee' }, member)
    expect(response.status).toBe(200)

    const body = (await response.json()) as BookingDetail
    expect(body.status).toBe('CHECKED_IN')
    expect(body.checkedInAt).not.toBeNull()
    expect(body.canCheckIn).toBe(false)
    expect(body.canCancel).toBe(false)
  })

  it('refuses a tap outside the window', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Trotec trop tôt', {
      requiresCertification: false,
      nfcTagId: 'nfc-trotec-trop-tot',
    })
    const member = await join(FORGE, 'MEMBER')
    const booking = await bookAt(machineId, IN_THREE_DAYS(), member)
    expect(booking.canCheckIn).toBe(false)

    const response = await checkIn(booking.id, { nfcTagId: 'nfc-trotec-trop-tot' }, member)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('CheckInWindowClosedError')
  })

  it('refuses the tag of another machine', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Trotec bon tag', {
      requiresCertification: false,
      nfcTagId: 'nfc-trotec-bon-tag',
    })
    const member = await join(FORGE, 'MEMBER')
    const booking = await bookAt(machineId, IN_A_MINUTE(), member)

    const response = await checkIn(booking.id, { nfcTagId: 'nfc-une-autre-machine' }, member)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('NfcTagMismatchError')
  })

  it('refuses to check in twice', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Trotec têtue', {
      requiresCertification: false,
      nfcTagId: 'nfc-trotec-tetue',
    })
    const member = await join(FORGE, 'MEMBER')
    const booking = await bookAt(machineId, IN_A_MINUTE(), member)
    await checkIn(booking.id, { nfcTagId: 'nfc-trotec-tetue' }, member)

    const response = await checkIn(booking.id, { nfcTagId: 'nfc-trotec-tetue' }, member)
    expect(response.status).toBe(409)
    expect(((await response.json()) as { _tag: string })._tag).toBe('BookingNotCheckInableError')
  })

  it('answers 404 when the booking belongs to someone else', async () => {
    const { id: machineId } = await createMachine(FORGE, 'Trotec gardée', {
      requiresCertification: false,
      nfcTagId: 'nfc-trotec-gardee',
    })
    const owner = await join(FORGE, 'MEMBER')
    const stranger = await join(FORGE, 'MEMBER')
    const booking = await bookAt(machineId, IN_A_MINUTE(), owner)

    expect((await checkIn(booking.id, { nfcTagId: 'nfc-trotec-gardee' }, stranger)).status).toBe(404)
  })

  it('answers 404 on a booking that does not exist', async () => {
    const member = await join(FORGE, 'MEMBER')

    expect((await checkIn(UNKNOWN, { nfcTagId: 'nfc-peu-importe' }, member)).status).toBe(404)
  })

  it('turns an anonymous tap away', async () => {
    expect((await checkIn(UNKNOWN, { nfcTagId: 'nfc-peu-importe' })).status).toBe(401)
  })
})
