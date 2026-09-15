import { describe, expect, it } from 'vitest'

import { at, bookingFixture } from '../__tests__/booking.test-layer'
import { BookingStatus } from './booking.constants'
import { isCancellable } from './cancellation'

const NOW = at('2026-03-02T08:00:00Z')

describe('isCancellable', () => {
  it('lets the owner cancel a confirmed booking that has not started', () => {
    expect(isCancellable(bookingFixture(), NOW)).toBe(true)
  })

  it('closes the door once the booking has started', () => {
    expect(isCancellable(bookingFixture(), at('2026-03-02T09:00:00Z'))).toBe(false)
  })

  it('refuses a booking already cancelled', () => {
    expect(isCancellable(bookingFixture({ status: BookingStatus.CANCELLED }), NOW)).toBe(false)
  })

  it('refuses a booking already checked in', () => {
    expect(isCancellable(bookingFixture({ status: BookingStatus.CHECKED_IN }), NOW)).toBe(false)
  })
})
