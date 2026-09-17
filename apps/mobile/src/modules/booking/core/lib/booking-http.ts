import { sendApiRequest, UNREACHABLE, type ApiRequest } from '../../../shared/core/http/api-client'
import { errorCodeOf } from '../../../shared/core/http/error-code'
import { BookingFailureCode, failure, type BookingResult } from '../model/booking'

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
  NFC_TAG_MISMATCH: BookingFailureCode.NFC_TAG_MISMATCH,
  VALIDATION_FAILED: BookingFailureCode.INVALID_INPUT,
  UNAUTHORIZED: BookingFailureCode.UNAUTHORIZED,
  MachineNotBookableError: BookingFailureCode.MACHINE_NOT_BOOKABLE,
  MachineUnavailableError: BookingFailureCode.MACHINE_UNAVAILABLE,
  MissingCertificationError: BookingFailureCode.MISSING_CERTIFICATION,
  SlotInThePastError: BookingFailureCode.SLOT_IN_THE_PAST,
  BookingOverlapError: BookingFailureCode.SLOT_TAKEN,
  BookingUnknownError: BookingFailureCode.BOOKING_UNKNOWN,
  BookingNotCancellableError: BookingFailureCode.NOT_CANCELLABLE,
  BookingNotCheckInableError: BookingFailureCode.NOT_CHECK_INABLE,
  CheckInWindowClosedError: BookingFailureCode.CHECK_IN_WINDOW_CLOSED,
  NfcTagMismatchError: BookingFailureCode.NFC_TAG_MISMATCH,
  UnauthorizedError: BookingFailureCode.UNAUTHORIZED,
}

export const codeOf = (status: number, body: unknown): BookingFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return BookingFailureCode.INVALID_INPUT
  if (status === 401) return BookingFailureCode.UNAUTHORIZED
  if (status === 404) return BookingFailureCode.BOOKING_UNKNOWN
  return BookingFailureCode.UNREACHABLE
}

export const requestBooking = async <A>(
  baseUrl: string,
  path: string,
  request: ApiRequest
): Promise<BookingResult<A>> => {
  const { status, body } = await sendApiRequest(baseUrl, path, request)
  if (status === UNREACHABLE) return failure(BookingFailureCode.UNREACHABLE)
  if (status >= 400) return failure(codeOf(status, body))
  return { ok: true, value: body as A }
}
