import { errorCodeOf } from '@etabli/api-client'
import { ApiErrorCode } from '@etabli/contract'

import type { BookingFailureCode } from '../model/booking'

const BY_CODE: Readonly<Partial<Record<ApiErrorCode, BookingFailureCode>>> = {
  [ApiErrorCode.MACHINE_NOT_BOOKABLE]: 'MACHINE_NOT_BOOKABLE',
  [ApiErrorCode.MACHINE_UNAVAILABLE]: 'MACHINE_UNAVAILABLE',
  [ApiErrorCode.MISSING_CERTIFICATION]: 'MISSING_CERTIFICATION',
  [ApiErrorCode.SLOT_IN_THE_PAST]: 'SLOT_IN_THE_PAST',
  [ApiErrorCode.BOOKING_OVERLAP]: 'SLOT_TAKEN',
  [ApiErrorCode.BOOKING_UNKNOWN]: 'BOOKING_UNKNOWN',
  [ApiErrorCode.BOOKING_NOT_CANCELLABLE]: 'NOT_CANCELLABLE',
  [ApiErrorCode.BOOKING_NOT_CHECK_INABLE]: 'NOT_CHECK_INABLE',
  [ApiErrorCode.CHECK_IN_WINDOW_CLOSED]: 'CHECK_IN_WINDOW_CLOSED',
  [ApiErrorCode.CHECK_IN_TOKEN_MISMATCH]: 'CHECK_IN_TOKEN_MISMATCH',
  [ApiErrorCode.VALIDATION_FAILED]: 'INVALID_INPUT',
  [ApiErrorCode.UNAUTHORIZED]: 'UNAUTHORIZED',
}

export const bookingFailureOf = (status: number, body: unknown): BookingFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code as ApiErrorCode]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_INPUT'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'BOOKING_UNKNOWN'
  return 'UNREACHABLE'
}
