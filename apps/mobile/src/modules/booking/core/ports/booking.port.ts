import type { BookingDetail, BookingResult, CreateBooking, MachineAvailability } from '../model/booking'

export interface IBookingPort {
  availability(token: string, machineId: string, from?: string): Promise<BookingResult<MachineAvailability>>
  create(token: string, input: CreateBooking): Promise<BookingResult<BookingDetail>>
  list(token: string): Promise<BookingResult<ReadonlyArray<BookingDetail>>>
  getById(token: string, id: string): Promise<BookingResult<BookingDetail>>
  cancel(token: string, id: string): Promise<BookingResult<BookingDetail>>
  checkIn(token: string, id: string, checkInToken: string): Promise<BookingResult<BookingDetail>>
}
