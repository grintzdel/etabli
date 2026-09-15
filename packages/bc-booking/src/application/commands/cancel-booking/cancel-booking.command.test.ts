import type { BookingId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  at,
  bookingFixture,
  failureTag,
  FORGE,
  machineFixture,
  makeTestLayer,
  memberships,
} from '../../../__tests__/booking.test-layer'
import { BookingStatus } from '../../../domain/booking.constants'
import type { Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { cancelBooking } from './cancel-booking.command'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const SOMEONE_ELSE = UserId.make('00000000-0000-4000-8000-000000000002')
const NOW = at('2026-03-01T00:00:00Z')
const MACHINE = machineFixture()

let repository: BookingRepositoryMemory

const run = (bookingId: BookingId, now: DateTime.Utc = NOW) =>
  Effect.runPromiseExit(
    cancelBooking(bookingId).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [MACHINE],
          auth: { userId: ME, memberships: memberships(FORGE, 'MEMBER') },
          now,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}): Promise<Booking> =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: MACHINE.machineId, userId: ME, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('cancelBooking', () => {
  it('cancels a confirmed booking of the caller and stamps who cancelled it', async () => {
    const booking = await store()

    const exit = await run(booking.id)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(BookingStatus.CANCELLED)
    expect(exit.value.cancelledAt).toStrictEqual(NOW)
    expect(exit.value.canCancel).toBe(false)

    const stored = await Effect.runPromise(repository.findById(booking.id))
    expect(stored?.cancelledBy).toBe(ME)
  })

  it('frees the slot it held', async () => {
    const booking = await store()
    await run(booking.id)

    const active = await Effect.runPromise(
      repository.listActiveForMachineBetween(MACHINE.machineId, at('2026-03-01T00:00:00Z'), at('2026-03-08T00:00:00Z'))
    )

    expect(active).toHaveLength(0)
  })

  it('refuses a booking that does not exist', async () => {
    const exit = await run(bookingFixture().id)

    expect(failureTag(exit)).toBe('BookingUnknownError')
  })

  it('hides a booking that belongs to someone else behind the same answer', async () => {
    const booking = await store({ userId: SOMEONE_ELSE })

    const exit = await run(booking.id)

    expect(failureTag(exit)).toBe('BookingUnknownError')
  })

  it('refuses once the booking has started', async () => {
    const booking = await store()

    const exit = await run(booking.id, at('2026-03-02T09:30:00Z'))

    expect(failureTag(exit)).toBe('BookingNotCancellableError')
  })

  it('refuses to cancel twice', async () => {
    const booking = await store()
    await run(booking.id)

    const exit = await run(booking.id)

    expect(failureTag(exit)).toBe('BookingNotCancellableError')
  })
})
