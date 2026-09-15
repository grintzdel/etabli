import { describe, expect, it } from 'vitest'

import { at, bookingFixture } from '../__tests__/booking.test-layer'
import { BookingStatus } from './booking.constants'
import { isNoShowMarkable } from './no-show'

const booking = bookingFixture()

describe('isNoShowMarkable', () => {
  it('waits for the check-in window to close', () => {
    expect(isNoShowMarkable(booking, at('2026-03-02T09:30:00Z'))).toBe(false)
    expect(isNoShowMarkable(booking, at('2026-03-02T09:30:01Z'))).toBe(true)
  })

  it('leaves alone a member who did turn up', () => {
    expect(isNoShowMarkable(bookingFixture({ status: BookingStatus.CHECKED_IN }), at('2026-03-02T12:00:00Z'))).toBe(
      false
    )
  })

  it('leaves alone a slot called off, closed or already marked', () => {
    const late = at('2026-03-02T12:00:00Z')

    expect(isNoShowMarkable(bookingFixture({ status: BookingStatus.CANCELLED }), late)).toBe(false)
    expect(isNoShowMarkable(bookingFixture({ status: BookingStatus.COMPLETED }), late)).toBe(false)
    expect(isNoShowMarkable(bookingFixture({ status: BookingStatus.NO_SHOW }), late)).toBe(false)
  })
})
