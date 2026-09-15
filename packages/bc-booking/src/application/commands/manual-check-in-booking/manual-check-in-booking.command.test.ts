import type { AtelierId, BookingId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import type * as DateTime from 'effect/DateTime'
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
import { BookingStatus, CheckInMethod } from '../../../domain/booking.constants'
import type { Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { manualCheckInBooking } from './manual-check-in-booking.command'

const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const FABMANAGER = UserId.make('00000000-0000-4000-8000-000000000009')
const MEMBER = UserId.make('00000000-0000-4000-8000-000000000001')
const IN_WINDOW = at('2026-03-02T09:00:00Z')
const MACHINE = machineFixture({ nfcTagId: null })
const NAMES = new Map([[MEMBER, 'Camille Roux']])

let repository: BookingRepositoryMemory

const run = (
  bookingId: BookingId,
  atelierId: AtelierId = FORGE,
  role: 'MEMBER' | 'FABMANAGER' = 'FABMANAGER',
  now: DateTime.Utc = IN_WINDOW
) =>
  Effect.runPromiseExit(
    manualCheckInBooking(bookingId).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [MACHINE],
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, role) },
          now,
          memberNames: NAMES,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}): Promise<Booking> =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: MACHINE.machineId, userId: MEMBER, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('manualCheckInBooking', () => {
  it('stamps the presence without a tag and names the method', async () => {
    const booking = await store()

    const exit = await run(booking.id)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(BookingStatus.CHECKED_IN)
    expect(exit.value.checkedInVia).toBe(CheckInMethod.MANUAL)
    expect(exit.value.memberName).toBe('Camille Roux')
    expect(exit.value.canCheckIn).toBe(false)
  })

  it('hides a booking held by an atelier the caller does not run', async () => {
    const booking = await store()

    expect(failureTag(await run(booking.id, LYON))).toBe('BookingUnknownError')
  })

  it('hides a booking from a plain member of the same atelier', async () => {
    const booking = await store()

    expect(failureTag(await run(booking.id, FORGE, 'MEMBER'))).toBe('BookingUnknownError')
  })

  it('refuses a booking already stamped', async () => {
    const booking = await store({ status: BookingStatus.CHECKED_IN })

    expect(failureTag(await run(booking.id))).toBe('BookingNotCheckInableError')
  })

  it('refuses a stamp half an hour and one minute after the start', async () => {
    const booking = await store()

    expect(failureTag(await run(booking.id, FORGE, 'FABMANAGER', at('2026-03-02T09:31:00Z')))).toBe(
      'CheckInWindowClosedError'
    )
  })
})
