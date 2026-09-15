import type { BookingResult } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'

export interface IManageBookingPort {
  list(token: string, query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>>
  checkIn(token: string, id: string): Promise<BookingResult<AtelierBooking>>
}
