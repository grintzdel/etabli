import type { CheckInMethod } from '../constants/booking.constant.ts'
import type { BookingEntity, BookingProps } from '../entities/booking.entity.ts'

export interface IBookingRepository {
  findById(id: string): Promise<BookingEntity | null>
  listActiveForMachineBetween(machineId: string, from: Date, to: Date): Promise<ReadonlyArray<BookingEntity>>
  listForUser(userId: string): Promise<ReadonlyArray<BookingEntity>>
  listForAteliersBetween(atelierIds: ReadonlyArray<string>, from: Date, to: Date): Promise<ReadonlyArray<BookingEntity>>
  insert(booking: BookingProps): Promise<BookingEntity>
  cancel(id: string, at: Date, by: string): Promise<BookingEntity | null>
  checkIn(id: string, at: Date, via: CheckInMethod): Promise<BookingEntity | null>
  markNoShow(id: string, at: Date): Promise<BookingEntity | null>
}
