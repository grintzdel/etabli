import { createApiClient, type ApiClient } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { bookingFailureOf } from '../lib/booking-failure'
import type { BookingFailureCode, BookingResult } from '../model/booking'
import { FAILURE_MESSAGES } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'
import type { AtelierStats, AtelierStatsQuery, NetworkStats } from '../model/manage-stats'
import type { IManageBookingPort } from '../ports/manage-booking.port'

export class ManageBookingHttpAdapter implements IManageBookingPort {
  private readonly http: ApiClient<BookingFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: bookingFailureOf,
      cache: 'no-store',
    })
  }

  list(token: string, query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>> {
    return this.http.call<ReadonlyArray<AtelierBooking>>(routes.manage.bookings, {
      token,
      query: { date: query.date, status: query.status },
    })
  }

  checkIn(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return this.http.call<AtelierBooking>(buildPath(routes.manage.checkInBooking, { id }), { method: 'POST', token })
  }

  markNoShow(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return this.http.call<AtelierBooking>(buildPath(routes.manage.noShow, { id }), { method: 'POST', token })
  }

  cancel(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return this.http.call<AtelierBooking>(buildPath(routes.manage.cancelBooking, { id }), { method: 'POST', token })
  }

  stats(token: string, query: AtelierStatsQuery): Promise<BookingResult<ReadonlyArray<AtelierStats>>> {
    return this.http.call<ReadonlyArray<AtelierStats>>(routes.manage.stats, { token, query: { period: query.period } })
  }

  networkStats(token: string, query: AtelierStatsQuery): Promise<BookingResult<NetworkStats>> {
    return this.http.call<NetworkStats>(routes.admin.stats, { token, query: { period: query.period } })
  }
}
