import type { BookingResult } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'
import type { AtelierStats, AtelierStatsQuery, NetworkStats } from '../model/manage-stats'

export interface IManageBookingPort {
  list(token: string, query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>>
  checkIn(token: string, id: string): Promise<BookingResult<AtelierBooking>>
  markNoShow(token: string, id: string): Promise<BookingResult<AtelierBooking>>
  cancel(token: string, id: string): Promise<BookingResult<AtelierBooking>>
  stats(token: string, query: AtelierStatsQuery): Promise<BookingResult<ReadonlyArray<AtelierStats>>>
  networkStats(token: string, query: AtelierStatsQuery): Promise<BookingResult<NetworkStats>>
}
