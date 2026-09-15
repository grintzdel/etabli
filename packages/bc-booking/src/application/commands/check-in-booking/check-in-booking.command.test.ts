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
import { BookingStatus, CheckInMethod } from '../../../domain/booking.constants'
import type { Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { checkInBooking } from './check-in-booking.command'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const SOMEONE_ELSE = UserId.make('00000000-0000-4000-8000-000000000002')
const TAG = 'nfc-forge-laser-01'
const IN_WINDOW = at('2026-03-02T09:00:00Z')
const MACHINE = machineFixture({ nfcTagId: TAG })
const OTHER_MACHINE = machineFixture({ nfcTagId: 'nfc-forge-prusa-01' })

let repository: BookingRepositoryMemory

const run = (bookingId: BookingId, nfcTagId: string = TAG, now: DateTime.Utc = IN_WINDOW) =>
  Effect.runPromiseExit(
    checkInBooking(bookingId, { nfcTagId }).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [MACHINE, OTHER_MACHINE],
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

describe('checkInBooking', () => {
  it('stamps the presence when the tag matches inside the window', async () => {
    const booking = await store()

    const exit = await run(booking.id)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(BookingStatus.CHECKED_IN)
    expect(exit.value.checkedInAt).toStrictEqual(IN_WINDOW)
    expect(exit.value.canCheckIn).toBe(false)
    expect(exit.value.canCancel).toBe(false)

    const stored = await Effect.runPromise(repository.findById(booking.id))
    expect(stored?.checkedInVia).toBe(CheckInMethod.NFC)
  })

  it('opens fifteen minutes before the slot', async () => {
    const booking = await store()

    expect(Exit.isSuccess(await run(booking.id, TAG, at('2026-03-02T08:45:00Z')))).toBe(true)
  })

  it('refuses a member who taps too early', async () => {
    const booking = await store()

    const exit = await run(booking.id, TAG, at('2026-03-02T08:44:00Z'))

    expect(failureTag(exit)).toBe('CheckInWindowClosedError')
  })

  it('refuses a member who taps more than thirty minutes late', async () => {
    const booking = await store()

    const exit = await run(booking.id, TAG, at('2026-03-02T09:31:00Z'))

    expect(failureTag(exit)).toBe('CheckInWindowClosedError')
  })

  it('refuses the tag of another machine', async () => {
    const booking = await store()

    const exit = await run(booking.id, 'nfc-forge-prusa-01')

    expect(failureTag(exit)).toBe('NfcTagMismatchError')
  })

  it('refuses a machine that carries no tag at all', async () => {
    const untagged = machineFixture({ nfcTagId: null })
    repository = makeBookingRepositoryMemory()
    const booking = await Effect.runPromise(
      repository.insert(bookingFixture({ machineId: untagged.machineId, userId: ME }))
    )

    const exit = await Effect.runPromiseExit(
      checkInBooking(booking.id, { nfcTagId: TAG }).pipe(
        Effect.provide(
          makeTestLayer({
            repository,
            machines: [untagged],
            auth: { userId: ME, memberships: memberships(FORGE, 'MEMBER') },
            now: IN_WINDOW,
          })
        )
      )
    )

    expect(failureTag(exit)).toBe('NfcTagMismatchError')
  })

  it('refuses to check in twice', async () => {
    const booking = await store()
    await run(booking.id)

    const exit = await run(booking.id)

    expect(failureTag(exit)).toBe('BookingNotCheckInableError')
  })

  it('refuses a cancelled booking', async () => {
    const booking = await store({ status: BookingStatus.CANCELLED })

    const exit = await run(booking.id)

    expect(failureTag(exit)).toBe('BookingNotCheckInableError')
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
