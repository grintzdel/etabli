import type { BookingDetail, BookingResult } from '../model/booking'

export interface IBookingPort {
  list(token: string): Promise<BookingResult<ReadonlyArray<BookingDetail>>>
  getById(token: string, id: string): Promise<BookingResult<BookingDetail>>
  cancel(token: string, id: string): Promise<BookingResult<BookingDetail>>
}
