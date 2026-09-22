import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { bookingFailureOf } from '../lib/booking-failure'
import type {
  BookingDetail,
  BookingFailureCode,
  BookingResult,
  CreateBooking,
  MachineAvailability,
} from '../model/booking'
import { FAILURE_MESSAGES } from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

export class BookingHttpAdapter implements IBookingPort {
  private readonly authenticated: ApiClient<BookingFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: bookingFailureOf,
      getAuthToken,
      cache: 'no-store',
    })
  }

  availability(machineId: string, from?: string): Promise<BookingResult<MachineAvailability>> {
    return this.authenticated.get<MachineAvailability>(buildPath(routes.machines.availability, { id: machineId }), {
      query: { from },
    })
  }

  create(input: CreateBooking): Promise<BookingResult<BookingDetail>> {
    return this.authenticated.post<BookingDetail>(routes.bookings.create, input)
  }

  list(): Promise<BookingResult<ReadonlyArray<BookingDetail>>> {
    return this.authenticated.get<ReadonlyArray<BookingDetail>>(routes.bookings.list)
  }

  getById(id: string): Promise<BookingResult<BookingDetail>> {
    return this.authenticated.get<BookingDetail>(buildPath(routes.bookings.getById, { id }))
  }

  cancel(id: string): Promise<BookingResult<BookingDetail>> {
    return this.authenticated.post<BookingDetail>(buildPath(routes.bookings.cancel, { id }))
  }
}
