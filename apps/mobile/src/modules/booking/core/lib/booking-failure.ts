import { errorCodeOf } from '@etabli/shared/http'

import type { BookingFailureCode } from '../model/booking'

const BY_CODE: Readonly<Record<string, BookingFailureCode>> = {
  MACHINE_NOT_BOOKABLE: 'MACHINE_NOT_BOOKABLE',
  MACHINE_UNAVAILABLE: 'MACHINE_UNAVAILABLE',
  MISSING_CERTIFICATION: 'MISSING_CERTIFICATION',
  SLOT_IN_THE_PAST: 'SLOT_IN_THE_PAST',
  BOOKING_OVERLAP: 'SLOT_TAKEN',
  BOOKING_UNKNOWN: 'BOOKING_UNKNOWN',
  BOOKING_NOT_CANCELLABLE: 'NOT_CANCELLABLE',
  BOOKING_NOT_CHECK_INABLE: 'NOT_CHECK_INABLE',
  CHECK_IN_WINDOW_CLOSED: 'CHECK_IN_WINDOW_CLOSED',
  NFC_TAG_MISMATCH: 'NFC_TAG_MISMATCH',
  VALIDATION_FAILED: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
}

export const bookingFailureOf = (status: number, body: unknown): BookingFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_INPUT'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'BOOKING_UNKNOWN'
  return 'UNREACHABLE'
}
