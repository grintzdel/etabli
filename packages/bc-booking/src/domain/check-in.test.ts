import { describe, expect, it } from 'vitest'

import { at, bookingFixture } from '../__tests__/booking.test-layer'
import { BookingStatus } from './booking.constants'
import { checkInWindow, isCheckInOpen } from './check-in'

describe('checkInWindow', () => {
  it('opens fifteen minutes before the slot and closes thirty after', () => {
    const window = checkInWindow(bookingFixture())

    expect(window.opensAt).toStrictEqual(at('2026-03-02T08:45:00Z'))
    expect(window.closesAt).toStrictEqual(at('2026-03-02T09:30:00Z'))
  })
})

describe('isCheckInOpen', () => {
  it('lets the member check in on the minute the slot starts', () => {
    expect(isCheckInOpen(bookingFixture(), at('2026-03-02T09:00:00Z'))).toBe(true)
  })

  it('accepts both edges of the window', () => {
    expect(isCheckInOpen(bookingFixture(), at('2026-03-02T08:45:00Z'))).toBe(true)
    expect(isCheckInOpen(bookingFixture(), at('2026-03-02T09:30:00Z'))).toBe(true)
  })

  it('refuses a minute too early', () => {
    expect(isCheckInOpen(bookingFixture(), at('2026-03-02T08:44:00Z'))).toBe(false)
  })

  it('refuses a minute too late', () => {
    expect(isCheckInOpen(bookingFixture(), at('2026-03-02T09:31:00Z'))).toBe(false)
  })

  it('refuses a booking already checked in', () => {
    expect(isCheckInOpen(bookingFixture({ status: BookingStatus.CHECKED_IN }), at('2026-03-02T09:00:00Z'))).toBe(false)
  })

  it('refuses a cancelled booking inside the window', () => {
    expect(isCheckInOpen(bookingFixture({ status: BookingStatus.CANCELLED }), at('2026-03-02T09:00:00Z'))).toBe(false)
  })
})
