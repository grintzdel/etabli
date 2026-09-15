import { describe, expect, it } from 'vitest'

import { at, bookingFixture } from '../__tests__/booking.test-layer'
import { BookingStatus } from './booking.constants'
import { effectiveStatus, isCompleted } from './completion'

const CHECKED_IN = bookingFixture({ status: BookingStatus.CHECKED_IN })

describe('isCompleted', () => {
  it('holds once a stamped slot has run its course', () => {
    expect(isCompleted(CHECKED_IN, at('2026-03-02T10:00:00Z'))).toBe(true)
  })

  it('waits for the very last minute of the slot', () => {
    expect(isCompleted(CHECKED_IN, at('2026-03-02T09:59:59Z'))).toBe(false)
  })

  it('refuses a slot nobody stamped, however old', () => {
    expect(isCompleted(bookingFixture(), at('2026-04-01T00:00:00Z'))).toBe(false)
  })

  it('refuses a slot called off before its end', () => {
    const cancelled = bookingFixture({ status: BookingStatus.CANCELLED })
    expect(isCompleted(cancelled, at('2026-04-01T00:00:00Z'))).toBe(false)
  })
})

describe('effectiveStatus', () => {
  it('reads a stamped and finished slot as completed', () => {
    expect(effectiveStatus(CHECKED_IN, at('2026-03-02T10:00:00Z'))).toBe(BookingStatus.COMPLETED)
  })

  it('leaves a running slot stamped', () => {
    expect(effectiveStatus(CHECKED_IN, at('2026-03-02T09:30:00Z'))).toBe(BookingStatus.CHECKED_IN)
  })

  it('hands back the stored status of every other slot', () => {
    for (const status of [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]) {
      expect(effectiveStatus(bookingFixture({ status }), at('2026-04-01T00:00:00Z'))).toBe(status)
    }
  })
})
