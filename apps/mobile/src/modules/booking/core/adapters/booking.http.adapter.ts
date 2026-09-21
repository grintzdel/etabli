import { buildPath, routes } from '@etabli/contract'
import { createApiClient, errorCodeOf, type ApiClient } from '@etabli/shared/http'

import {
  FAILURE_MESSAGES,
  type BookingDetail,
  type BookingFailureCode,
  type BookingResult,
  type CreateBooking,
  type MachineAvailability,
} from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

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
  MachineNotBookableError: 'MACHINE_NOT_BOOKABLE',
  MachineUnavailableError: 'MACHINE_UNAVAILABLE',
  MissingCertificationError: 'MISSING_CERTIFICATION',
  SlotInThePastError: 'SLOT_IN_THE_PAST',
  BookingOverlapError: 'SLOT_TAKEN',
  BookingUnknownError: 'BOOKING_UNKNOWN',
  BookingNotCancellableError: 'NOT_CANCELLABLE',
  BookingNotCheckInableError: 'NOT_CHECK_INABLE',
  CheckInWindowClosedError: 'CHECK_IN_WINDOW_CLOSED',
  NfcTagMismatchError: 'NFC_TAG_MISMATCH',
  UnauthorizedError: 'UNAUTHORIZED',
}

const failureOf = (status: number, body: unknown): BookingFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_INPUT'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'BOOKING_UNKNOWN'
  return 'UNREACHABLE'
}

export class BookingHttpAdapter implements IBookingPort {
  private readonly http: ApiClient<BookingFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf })
  }

  availability(token: string, machineId: string, from?: string): Promise<BookingResult<MachineAvailability>> {
    return this.http.call<MachineAvailability>(buildPath(routes.machines.availability, { id: machineId }), {
      token,
      query: { from },
    })
  }

  create(token: string, input: CreateBooking): Promise<BookingResult<BookingDetail>> {
    return this.http.call<BookingDetail>(routes.bookings.create, { method: 'POST', token, body: input })
  }

  list(token: string): Promise<BookingResult<ReadonlyArray<BookingDetail>>> {
    return this.http.call<ReadonlyArray<BookingDetail>>(routes.bookings.list, { token })
  }

  getById(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    return this.http.call<BookingDetail>(buildPath(routes.bookings.getById, { id }), { token })
  }

  cancel(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    return this.http.call<BookingDetail>(buildPath(routes.bookings.cancel, { id }), { method: 'POST', token })
  }

  checkIn(token: string, id: string, nfcTagId: string): Promise<BookingResult<BookingDetail>> {
    return this.http.call<BookingDetail>(buildPath(routes.bookings.checkIn, { id }), {
      method: 'POST',
      token,
      body: { nfcTagId },
    })
  }
}
