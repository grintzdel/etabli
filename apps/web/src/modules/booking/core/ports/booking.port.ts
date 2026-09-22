import type { BookingDetail, BookingResult, CreateBooking, MachineAvailability } from '../model/booking'

export interface IBookingPort {
  availability(machineId: string, from?: string): Promise<BookingResult<MachineAvailability>>
  create(input: CreateBooking): Promise<BookingResult<BookingDetail>>
  list(): Promise<BookingResult<ReadonlyArray<BookingDetail>>>
  getById(id: string): Promise<BookingResult<BookingDetail>>
  cancel(id: string): Promise<BookingResult<BookingDetail>>
}
