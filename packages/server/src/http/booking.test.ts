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

const addMachine = async (atelierId: string, name: string, slotDurationMinutes = 60): Promise<string> => {
  const fabmanager = await join(atelierId, 'FABMANAGER')
  const response = await send(
    'POST',
    '/manage/machines',
    { atelierId, name, kind: 'LASER_CUTTER', slotDurationMinutes },
    fabmanager
  )
  const { id } = (await response.json()) as { id: string }
  return id
}

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
