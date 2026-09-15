import { buildPath, routes } from '@etabli/contract'

import type { BookingDetail, BookingResult, CreateBooking, MachineAvailability } from '../model/booking'
import { BookingFailureCode, failure } from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

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
  NfcTagMismatchError: BookingFailureCode.NFC_TAG_MISMATCH,
}

const tagOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const tag = (body as { readonly _tag?: unknown })._tag
  return typeof tag === 'string' ? tag : undefined
}

const codeOf = (status: number, body: unknown): BookingFailureCode => {
  const tag = tagOf(body)
  const mapped = tag === undefined ? undefined : BY_TAG[tag]
  if (mapped !== undefined) return mapped
  if (status === 401) return BookingFailureCode.UNAUTHORIZED
  if (status === 404) return BookingFailureCode.BOOKING_UNKNOWN
  return BookingFailureCode.UNREACHABLE
}

export class BookingHttpAdapter implements IBookingPort {
  constructor(private readonly baseUrl: string) {}

  private async call<A>(path: string, token: string, init?: RequestInit): Promise<BookingResult<A>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    } catch {
      return failure(BookingFailureCode.UNREACHABLE)
    }

    const body = await response.json().catch(() => null)
    if (!response.ok) return failure(codeOf(response.status, body))
    if (body === null) return failure(BookingFailureCode.UNREACHABLE)

    return { ok: true, value: body as A }
  }

  availability(token: string, machineId: string, from?: string): Promise<BookingResult<MachineAvailability>> {
    const path = buildPath(routes.machines.availability, { id: machineId })
    const query = from === undefined ? '' : `?from=${encodeURIComponent(from)}`
    return this.call<MachineAvailability>(`${path}${query}`, token)
  }

  create(token: string, input: CreateBooking): Promise<BookingResult<BookingDetail>> {
    return this.call<BookingDetail>(routes.bookings.create, token, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  list(token: string): Promise<BookingResult<ReadonlyArray<BookingDetail>>> {
    return this.call<ReadonlyArray<BookingDetail>>(routes.bookings.list, token)
  }

  getById(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    return this.call<BookingDetail>(buildPath(routes.bookings.getById, { id }), token)
  }

  cancel(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    return this.call<BookingDetail>(buildPath(routes.bookings.cancel, { id }), token, { method: 'POST' })
  }
}
