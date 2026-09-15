import type { BookingId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
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
import type { Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { getBookingDetail } from './get-booking-detail.query'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const SOMEONE_ELSE = UserId.make('00000000-0000-4000-8000-000000000002')
const NOW = at('2026-03-01T00:00:00Z')
const TROTEC = machineFixture({ machineName: 'Trotec', atelierSlug: 'la-forge' })

let repository: BookingRepositoryMemory

const run = (bookingId: BookingId) =>
  Effect.runPromiseExit(
    getBookingDetail(bookingId).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [TROTEC],
          auth: { userId: ME, memberships: memberships(FORGE, 'MEMBER') },
          now: NOW,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}) =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: TROTEC.machineId, userId: ME, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('getBookingDetail', () => {
  it('reads a booking of the caller with its machine and its atelier', async () => {
    const booking = await store()

    const exit = await run(booking.id)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.id).toBe(booking.id)
    expect(exit.value.machineName).toBe('Trotec')
    expect(exit.value.atelierSlug).toBe('la-forge')
    expect(exit.value.canCancel).toBe(true)
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
})
