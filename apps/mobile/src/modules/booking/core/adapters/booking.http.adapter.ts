import { createApiClient, type ApiClient } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { bookingFailureOf } from '../lib/booking-failure'
import {
  FAILURE_MESSAGES,
  type BookingDetail,
  type BookingFailureCode,
  type BookingResult,
  type CreateBooking,
  type MachineAvailability,
} from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

export class BookingHttpAdapter implements IBookingPort {
  private readonly http: ApiClient<BookingFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf: bookingFailureOf })
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
