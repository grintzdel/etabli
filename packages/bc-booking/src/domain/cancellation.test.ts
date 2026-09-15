import { describe, expect, it } from 'vitest'

import { at, bookingFixture } from '../__tests__/booking.test-layer'
import { BookingStatus } from './booking.constants'
import { isCancellable, isCancellableByAtelier } from './cancellation'

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

describe('isCancellableByAtelier', () => {
  it('lets the atelier call off a slot that has not started', () => {
    expect(isCancellableByAtelier(bookingFixture(), NOW)).toBe(true)
  })

  it('keeps the door open while the slot runs, where the member has lost it', () => {
    const halfway = at('2026-03-02T09:30:00Z')
    expect(isCancellableByAtelier(bookingFixture(), halfway)).toBe(true)
    expect(isCancellable(bookingFixture(), halfway)).toBe(false)
  })

  it('closes at the end of the slot', () => {
    expect(isCancellableByAtelier(bookingFixture(), at('2026-03-02T10:00:00Z'))).toBe(false)
  })

  it('refuses a slot already stamped', () => {
    expect(isCancellableByAtelier(bookingFixture({ status: BookingStatus.CHECKED_IN }), NOW)).toBe(false)
  })

  it('refuses a slot already called off', () => {
    expect(isCancellableByAtelier(bookingFixture({ status: BookingStatus.CANCELLED }), NOW)).toBe(false)
  })
})
