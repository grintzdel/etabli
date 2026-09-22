import type { BookingResult } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'
import type { AtelierStats, AtelierStatsQuery, NetworkStats } from '../model/manage-stats'

export interface IManageBookingPort {
  list(query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>>
  checkIn(id: string): Promise<BookingResult<AtelierBooking>>
  markNoShow(id: string): Promise<BookingResult<AtelierBooking>>
  cancel(id: string): Promise<BookingResult<AtelierBooking>>
  stats(query: AtelierStatsQuery): Promise<BookingResult<ReadonlyArray<AtelierStats>>>
  networkStats(query: AtelierStatsQuery): Promise<BookingResult<NetworkStats>>
}
