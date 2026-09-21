import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import type { BookingFailureCode } from '../model/booking'
import { bookingFailureOf } from './booking-failure'

const MAPPED: ReadonlyArray<readonly [ApiErrorCode, BookingFailureCode]> = [
  [ApiErrorCode.MACHINE_NOT_BOOKABLE, 'MACHINE_NOT_BOOKABLE'],
  [ApiErrorCode.MACHINE_UNAVAILABLE, 'MACHINE_UNAVAILABLE'],
  [ApiErrorCode.MISSING_CERTIFICATION, 'MISSING_CERTIFICATION'],
  [ApiErrorCode.SLOT_IN_THE_PAST, 'SLOT_IN_THE_PAST'],
  [ApiErrorCode.BOOKING_OVERLAP, 'SLOT_TAKEN'],
  [ApiErrorCode.BOOKING_UNKNOWN, 'BOOKING_UNKNOWN'],
  [ApiErrorCode.BOOKING_NOT_CANCELLABLE, 'NOT_CANCELLABLE'],
  [ApiErrorCode.BOOKING_NOT_CHECK_INABLE, 'NOT_CHECK_INABLE'],
  [ApiErrorCode.CHECK_IN_WINDOW_CLOSED, 'CHECK_IN_WINDOW_CLOSED'],
  [ApiErrorCode.NFC_TAG_MISMATCH, 'NFC_TAG_MISMATCH'],
  [ApiErrorCode.VALIDATION_FAILED, 'INVALID_INPUT'],
  [ApiErrorCode.UNAUTHORIZED, 'UNAUTHORIZED'],
]

describe('bookingFailureOf', () => {
  it.each(MAPPED)('translates %s', (code, expected) => {
    expect(bookingFailureOf(409, { code })).toBe(expected)
  })

  it('tells a wrong tag apart from a closed check-in window, both on a 409', () => {
    expect(bookingFailureOf(409, { code: ApiErrorCode.NFC_TAG_MISMATCH })).toBe('NFC_TAG_MISMATCH')
    expect(bookingFailureOf(409, { code: ApiErrorCode.CHECK_IN_WINDOW_CLOSED })).toBe('CHECK_IN_WINDOW_CLOSED')
  })

  it('prefers the body code over the status', () => {
    expect(bookingFailureOf(404, { code: ApiErrorCode.MISSING_CERTIFICATION })).toBe('MISSING_CERTIFICATION')
  })

  it.each([
    [400, 'INVALID_INPUT'],
    [401, 'UNAUTHORIZED'],
    [404, 'BOOKING_UNKNOWN'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(bookingFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(bookingFailureOf(0, null)).toBe('UNREACHABLE')
  })

  it('reads a code it does not know as unreachable', () => {
    expect(bookingFailureOf(500, { code: 'BOOKING_SOMETHING_NEW' })).toBe('UNREACHABLE')
  })
})
