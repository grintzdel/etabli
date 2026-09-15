import type { AtelierId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import type * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  at,
  bookingFixture,
  FORGE,
  machineFixture,
  makeTestLayer,
  memberships,
} from '../../../__tests__/booking.test-layer'
import { UNKNOWN_MEMBER } from '../../../domain/atelier-booking'
import { BookingStatus } from '../../../domain/booking.constants'
import type { AtelierBookingsParams, Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { listAtelierBookings } from './list-atelier-bookings.query'

const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const FABMANAGER = UserId.make('00000000-0000-4000-8000-000000000009')
const CAMILLE = UserId.make('00000000-0000-4000-8000-000000000001')
const GHOST = UserId.make('00000000-0000-4000-8000-000000000003')
const NOON = at('2026-03-02T11:00:00Z')
const MACHINE = machineFixture()
const LYON_MACHINE = machineFixture({ atelierId: LYON, atelierName: 'Lyon Fabrique' })
const NAMES = new Map([[CAMILLE, 'Camille Roux']])

let repository: BookingRepositoryMemory

const run = (
  params: AtelierBookingsParams = {},
  atelierId: AtelierId = FORGE,
  role: 'MEMBER' | 'FABMANAGER' = 'FABMANAGER',
  now: DateTime.Utc = NOON
) =>
  Effect.runPromise(
    listAtelierBookings(params).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [MACHINE, LYON_MACHINE],
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, role) },
          now,
          memberNames: NAMES,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}): Promise<Booking> =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: MACHINE.machineId, userId: CAMILLE, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('listAtelierBookings', () => {
  it('lists today’s slots of the ateliers the caller runs', async () => {
    await store()

    const bookings = await run()

    expect(bookings).toHaveLength(1)
    expect(bookings[0]?.memberName).toBe('Camille Roux')
    expect(bookings[0]?.machineName).toBe(MACHINE.machineName)
  })

  it('leaves out the ateliers the caller only belongs to', async () => {
    await store()

    expect(await run({}, FORGE, 'MEMBER')).toStrictEqual([])
  })

  it('leaves out an atelier the caller runs elsewhere', async () => {
    await store({ atelierId: LYON, machineId: LYON_MACHINE.machineId })

    expect(await run()).toStrictEqual([])
  })

  it('keeps the day of the given date rather than the day of the call', async () => {
    await store({ startAt: at('2026-03-05T09:00:00Z'), endAt: at('2026-03-05T10:00:00Z') })

    expect(await run()).toStrictEqual([])
    expect(await run({ date: at('2026-03-05T22:30:00Z') })).toHaveLength(1)
  })

  it('narrows to a single status when one is asked for', async () => {
    await store()
    await store({
      startAt: at('2026-03-02T14:00:00Z'),
      endAt: at('2026-03-02T15:00:00Z'),
      status: BookingStatus.CANCELLED,
    })

    const cancelled = await run({ status: BookingStatus.CANCELLED })

    expect(cancelled).toHaveLength(1)
    expect(cancelled[0]?.status).toBe(BookingStatus.CANCELLED)
  })

  it('names a member whose account is gone', async () => {
    await store({ userId: GHOST })

    expect((await run())[0]?.memberName).toBe(UNKNOWN_MEMBER)
  })

  it('opens the stamp inside the window and closes it outside', async () => {
    await store()

    expect((await run({}, FORGE, 'FABMANAGER', at('2026-03-02T08:50:00Z')))[0]?.canCheckIn).toBe(true)
    expect((await run())[0]?.canCheckIn).toBe(false)
  })
})
