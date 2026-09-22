import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { bookingFailureOf } from '../lib/booking-failure'
import type { BookingFailureCode, BookingResult } from '../model/booking'
import { FAILURE_MESSAGES } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'
import type { AtelierStats, AtelierStatsQuery, NetworkStats } from '../model/manage-stats'
import type { IManageBookingPort } from '../ports/manage-booking.port'

export class ManageBookingHttpAdapter implements IManageBookingPort {
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

  list(query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>> {
    return this.authenticated.get<ReadonlyArray<AtelierBooking>>(routes.manage.bookings, {
      query: { date: query.date, status: query.status },
    })
  }

  checkIn(id: string): Promise<BookingResult<AtelierBooking>> {
    return this.authenticated.post<AtelierBooking>(buildPath(routes.manage.checkInBooking, { id }))
  }

  markNoShow(id: string): Promise<BookingResult<AtelierBooking>> {
    return this.authenticated.post<AtelierBooking>(buildPath(routes.manage.noShow, { id }))
  }

  cancel(id: string): Promise<BookingResult<AtelierBooking>> {
    return this.authenticated.post<AtelierBooking>(buildPath(routes.manage.cancelBooking, { id }))
  }

  stats(query: AtelierStatsQuery): Promise<BookingResult<ReadonlyArray<AtelierStats>>> {
    return this.authenticated.get<ReadonlyArray<AtelierStats>>(routes.manage.stats, {
      query: { period: query.period },
    })
  }

  networkStats(query: AtelierStatsQuery): Promise<BookingResult<NetworkStats>> {
    return this.authenticated.get<NetworkStats>(routes.admin.stats, { query: { period: query.period } })
  }
}
