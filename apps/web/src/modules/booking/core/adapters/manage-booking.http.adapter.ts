import { buildPath, routes } from '@etabli/contract'

import { requestBooking } from '../lib/booking-http'
import type { BookingResult } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'
import type { IManageBookingPort } from '../ports/manage-booking.port'

const queryString = (query: AtelierBookingsQuery): string => {
  const params = new URLSearchParams()
  if (query.date !== undefined) params.set('date', query.date)
  if (query.status !== undefined) params.set('status', query.status)
  const serialized = params.toString()
  return serialized.length === 0 ? '' : `?${serialized}`
}

export class ManageBookingHttpAdapter implements IManageBookingPort {
  constructor(private readonly baseUrl: string) {}

  list(token: string, query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>> {
    return requestBooking<ReadonlyArray<AtelierBooking>>(
      this.baseUrl,
      `${routes.manage.bookings}${queryString(query)}`,
      token
    )
  }

  checkIn(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return requestBooking<AtelierBooking>(this.baseUrl, buildPath(routes.manage.checkInBooking, { id }), token, {
      method: 'POST',
    })
  }

  markNoShow(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return requestBooking<AtelierBooking>(this.baseUrl, buildPath(routes.manage.noShow, { id }), token, {
      method: 'POST',
    })
  }
}
