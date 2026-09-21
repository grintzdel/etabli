import { ApiErrorCode } from '@etabli/contract'
import { errorCodeOf } from '@etabli/shared/http'

import { BookingFailureCode } from '../model/booking'

const BY_CODE: Readonly<Partial<Record<ApiErrorCode, BookingFailureCode>>> = {
  [ApiErrorCode.MACHINE_NOT_BOOKABLE]: BookingFailureCode.MACHINE_NOT_BOOKABLE,
  [ApiErrorCode.MACHINE_UNAVAILABLE]: BookingFailureCode.MACHINE_UNAVAILABLE,
  [ApiErrorCode.MISSING_CERTIFICATION]: BookingFailureCode.MISSING_CERTIFICATION,
  [ApiErrorCode.SLOT_IN_THE_PAST]: BookingFailureCode.SLOT_IN_THE_PAST,
  [ApiErrorCode.BOOKING_OVERLAP]: BookingFailureCode.SLOT_TAKEN,
  [ApiErrorCode.BOOKING_UNKNOWN]: BookingFailureCode.BOOKING_UNKNOWN,
  [ApiErrorCode.BOOKING_NOT_CANCELLABLE]: BookingFailureCode.NOT_CANCELLABLE,
  [ApiErrorCode.BOOKING_NOT_CHECK_INABLE]: BookingFailureCode.NOT_CHECK_INABLE,
  [ApiErrorCode.CHECK_IN_WINDOW_CLOSED]: BookingFailureCode.CHECK_IN_WINDOW_CLOSED,
  [ApiErrorCode.BOOKING_NOT_MARKABLE_AS_NO_SHOW]: BookingFailureCode.NOT_MARKABLE_AS_NO_SHOW,
  [ApiErrorCode.NFC_TAG_MISMATCH]: BookingFailureCode.NFC_TAG_MISMATCH,
  [ApiErrorCode.FORBIDDEN]: BookingFailureCode.FORBIDDEN,
}

export const bookingFailureOf = (status: number, body: unknown): BookingFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code as ApiErrorCode]
  if (mapped !== undefined) return mapped
  if (status === 401) return BookingFailureCode.UNAUTHORIZED
  if (status === 403) return BookingFailureCode.FORBIDDEN
  if (status === 404) return BookingFailureCode.BOOKING_UNKNOWN
  return BookingFailureCode.UNREACHABLE
}
