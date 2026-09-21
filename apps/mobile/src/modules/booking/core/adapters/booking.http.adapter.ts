import { buildPath, routes } from '@etabli/contract'

import { requestBooking } from '../lib/booking-http'
import type { BookingDetail, BookingResult, CreateBooking, MachineAvailability } from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

export class BookingHttpAdapter implements IBookingPort {
  constructor(private readonly baseUrl: string) {}

  availability(token: string, machineId: string, from?: string): Promise<BookingResult<MachineAvailability>> {
    return requestBooking<MachineAvailability>(
      this.baseUrl,
      buildPath(routes.machines.availability, { id: machineId }),
      {
        token,
        ...(from === undefined ? {} : { query: { from } }),
      }
    )
  }

  create(token: string, input: CreateBooking): Promise<BookingResult<BookingDetail>> {
    return requestBooking<BookingDetail>(this.baseUrl, routes.bookings.create, { method: 'POST', token, body: input })
  }

  list(token: string): Promise<BookingResult<ReadonlyArray<BookingDetail>>> {
    return requestBooking<ReadonlyArray<BookingDetail>>(this.baseUrl, routes.bookings.list, { token })
  }

  getById(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    return requestBooking<BookingDetail>(this.baseUrl, buildPath(routes.bookings.getById, { id }), { token })
  }

  cancel(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    return requestBooking<BookingDetail>(this.baseUrl, buildPath(routes.bookings.cancel, { id }), {
      method: 'POST',
      token,
    })
  }

  checkIn(token: string, id: string, nfcTagId: string): Promise<BookingResult<BookingDetail>> {
    return requestBooking<BookingDetail>(this.baseUrl, buildPath(routes.bookings.checkIn, { id }), {
      method: 'POST',
      token,
      body: { nfcTagId },
    })
  }
}
