import type { BookingResult } from '../model/booking'
import { BookingFailureCode, failure } from '../model/booking'

const BY_TAG: Readonly<Record<string, BookingFailureCode>> = {
  MachineNotBookableError: BookingFailureCode.MACHINE_NOT_BOOKABLE,
  MachineUnavailableError: BookingFailureCode.MACHINE_UNAVAILABLE,
  MissingCertificationError: BookingFailureCode.MISSING_CERTIFICATION,
  SlotInThePastError: BookingFailureCode.SLOT_IN_THE_PAST,
  BookingOverlapError: BookingFailureCode.SLOT_TAKEN,
  BookingUnknownError: BookingFailureCode.BOOKING_UNKNOWN,
  BookingNotCancellableError: BookingFailureCode.NOT_CANCELLABLE,
  BookingNotCheckInableError: BookingFailureCode.NOT_CHECK_INABLE,
  CheckInWindowClosedError: BookingFailureCode.CHECK_IN_WINDOW_CLOSED,
  BookingNotMarkableAsNoShowError: BookingFailureCode.NOT_MARKABLE_AS_NO_SHOW,
  NfcTagMismatchError: BookingFailureCode.NFC_TAG_MISMATCH,
  ForbiddenError: BookingFailureCode.FORBIDDEN,
}

const tagOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const tag = (body as { readonly _tag?: unknown })._tag
  return typeof tag === 'string' ? tag : undefined
}

export const codeOf = (status: number, body: unknown): BookingFailureCode => {
  const tag = tagOf(body)
  const mapped = tag === undefined ? undefined : BY_TAG[tag]
  if (mapped !== undefined) return mapped
  if (status === 401) return BookingFailureCode.UNAUTHORIZED
  if (status === 403) return BookingFailureCode.FORBIDDEN
  if (status === 404) return BookingFailureCode.BOOKING_UNKNOWN
  return BookingFailureCode.UNREACHABLE
}

export const requestBooking = async <A>(
  baseUrl: string,
  path: string,
  token: string,
  init?: RequestInit
): Promise<BookingResult<A>> => {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return failure(BookingFailureCode.UNREACHABLE)
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) return failure(codeOf(response.status, body))
  if (body === null) return failure(BookingFailureCode.UNREACHABLE)

  return { ok: true, value: body as A }
}
