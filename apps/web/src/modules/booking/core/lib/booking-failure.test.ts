import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import { BookingFailureCode } from '../model/booking'
import { bookingFailureOf } from './booking-failure'

const MAPPED: ReadonlyArray<readonly [ApiErrorCode, BookingFailureCode]> = [
  [ApiErrorCode.MACHINE_NOT_BOOKABLE, BookingFailureCode.MACHINE_NOT_BOOKABLE],
  [ApiErrorCode.MACHINE_UNAVAILABLE, BookingFailureCode.MACHINE_UNAVAILABLE],
  [ApiErrorCode.MISSING_CERTIFICATION, BookingFailureCode.MISSING_CERTIFICATION],
  [ApiErrorCode.SLOT_IN_THE_PAST, BookingFailureCode.SLOT_IN_THE_PAST],
  [ApiErrorCode.BOOKING_OVERLAP, BookingFailureCode.SLOT_TAKEN],
  [ApiErrorCode.BOOKING_UNKNOWN, BookingFailureCode.BOOKING_UNKNOWN],
  [ApiErrorCode.BOOKING_NOT_CANCELLABLE, BookingFailureCode.NOT_CANCELLABLE],
  [ApiErrorCode.BOOKING_NOT_CHECK_INABLE, BookingFailureCode.NOT_CHECK_INABLE],
  [ApiErrorCode.CHECK_IN_WINDOW_CLOSED, BookingFailureCode.CHECK_IN_WINDOW_CLOSED],
  [ApiErrorCode.BOOKING_NOT_MARKABLE_AS_NO_SHOW, BookingFailureCode.NOT_MARKABLE_AS_NO_SHOW],
  [ApiErrorCode.CHECK_IN_TOKEN_MISMATCH, BookingFailureCode.CHECK_IN_TOKEN_MISMATCH],
  [ApiErrorCode.FORBIDDEN, BookingFailureCode.FORBIDDEN],
]

describe('bookingFailureOf', () => {
  it.each(MAPPED)('translates %s', (code, expected) => {
    expect(bookingFailureOf(409, { code })).toBe(expected)
  })

  it('gives the five refusals sharing a 409 five distinct messages', () => {
    const shared = [
      ApiErrorCode.MACHINE_UNAVAILABLE,
      ApiErrorCode.SLOT_IN_THE_PAST,
      ApiErrorCode.BOOKING_OVERLAP,
      ApiErrorCode.BOOKING_NOT_CANCELLABLE,
      ApiErrorCode.CHECK_IN_WINDOW_CLOSED,
    ].map((code) => bookingFailureOf(409, { code }))

    expect(new Set(shared).size).toBe(shared.length)
  })

  it('prefers the body code over the status', () => {
    expect(bookingFailureOf(404, { code: ApiErrorCode.MISSING_CERTIFICATION })).toBe(
      BookingFailureCode.MISSING_CERTIFICATION
    )
  })

  it.each([
    [401, BookingFailureCode.UNAUTHORIZED],
    [403, BookingFailureCode.FORBIDDEN],
    [404, BookingFailureCode.BOOKING_UNKNOWN],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(bookingFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(bookingFailureOf(0, null)).toBe(BookingFailureCode.UNREACHABLE)
  })

  it('reads a code it does not know as unreachable', () => {
    expect(bookingFailureOf(500, { code: 'BOOKING_SOMETHING_NEW' })).toBe(BookingFailureCode.UNREACHABLE)
  })
})
