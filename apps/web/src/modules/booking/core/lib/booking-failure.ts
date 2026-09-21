import { errorCodeOf } from '@etabli/shared/http'

import { BookingFailureCode } from '../model/booking'

const BY_CODE: Readonly<Record<string, BookingFailureCode>> = {
  MACHINE_NOT_BOOKABLE: BookingFailureCode.MACHINE_NOT_BOOKABLE,
  MACHINE_UNAVAILABLE: BookingFailureCode.MACHINE_UNAVAILABLE,
  MISSING_CERTIFICATION: BookingFailureCode.MISSING_CERTIFICATION,
  SLOT_IN_THE_PAST: BookingFailureCode.SLOT_IN_THE_PAST,
  BOOKING_OVERLAP: BookingFailureCode.SLOT_TAKEN,
  BOOKING_UNKNOWN: BookingFailureCode.BOOKING_UNKNOWN,
  BOOKING_NOT_CANCELLABLE: BookingFailureCode.NOT_CANCELLABLE,
  BOOKING_NOT_CHECK_INABLE: BookingFailureCode.NOT_CHECK_INABLE,
  CHECK_IN_WINDOW_CLOSED: BookingFailureCode.CHECK_IN_WINDOW_CLOSED,
  BOOKING_NOT_MARKABLE_AS_NO_SHOW: BookingFailureCode.NOT_MARKABLE_AS_NO_SHOW,
  NFC_TAG_MISMATCH: BookingFailureCode.NFC_TAG_MISMATCH,
  FORBIDDEN: BookingFailureCode.FORBIDDEN,
}

export const bookingFailureOf = (status: number, body: unknown): BookingFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 401) return BookingFailureCode.UNAUTHORIZED
  if (status === 403) return BookingFailureCode.FORBIDDEN
  if (status === 404) return BookingFailureCode.BOOKING_UNKNOWN
  return BookingFailureCode.UNREACHABLE
}
