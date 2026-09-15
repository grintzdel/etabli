import { AtelierId, BookingId, MachineId, UserId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

import { BookableMachineStatus, BookingStatus, CheckInMethod, SlotReason, StatsPeriod } from './booking.constants'

export const BookingStatusSchema = Schema.Literal(
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW
)

export const CheckInMethodSchema = Schema.Literal(CheckInMethod.NFC, CheckInMethod.MANUAL)

export const BookableMachineStatusSchema = Schema.Literal(
  BookableMachineStatus.AVAILABLE,
  BookableMachineStatus.MAINTENANCE,
  BookableMachineStatus.RETIRED
)

export const SlotReasonSchema = Schema.Literal(
  SlotReason.FREE,
  SlotReason.BOOKED,
  SlotReason.PAST,
  SlotReason.MACHINE_UNAVAILABLE
)

export const BookingSchema = Schema.Struct({
  id: BookingId,
  machineId: MachineId,
  atelierId: AtelierId,
  userId: UserId,
  startAt: Schema.DateTimeUtc,
  endAt: Schema.DateTimeUtc,
  status: BookingStatusSchema,
  checkedInAt: Schema.NullOr(Schema.DateTimeUtc),
  checkedInVia: Schema.NullOr(CheckInMethodSchema),
  cancelledAt: Schema.NullOr(Schema.DateTimeUtc),
  cancelledBy: Schema.NullOr(UserId),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
})
export type Booking = Schema.Schema.Type<typeof BookingSchema>

export const AvailabilityParamsSchema = Schema.Struct({
  from: Schema.optional(Schema.DateTimeUtc),
})
export type AvailabilityParams = Schema.Schema.Type<typeof AvailabilityParamsSchema>

export const AvailabilitySlotSchema = Schema.Struct({
  startAt: Schema.DateTimeUtc,
  endAt: Schema.DateTimeUtc,
  available: Schema.Boolean,
  reason: SlotReasonSchema,
})
export type AvailabilitySlot = Schema.Schema.Type<typeof AvailabilitySlotSchema>

export const MachineAvailabilitySchema = Schema.Struct({
  machineId: MachineId,
  machineName: Schema.String,
  atelierId: AtelierId,
  atelierName: Schema.String,
  atelierSlug: Schema.String,
  machineStatus: BookableMachineStatusSchema,
  requiresCertification: Schema.Boolean,
  slotDurationMinutes: Schema.Int,
  from: Schema.DateTimeUtc,
  to: Schema.DateTimeUtc,
  slots: Schema.Array(AvailabilitySlotSchema),
})
export type MachineAvailability = Schema.Schema.Type<typeof MachineAvailabilitySchema>

export const CreateBookingSchema = Schema.Struct({
  machineId: MachineId,
  startAt: Schema.DateTimeUtc,
})
export type CreateBooking = Schema.Schema.Type<typeof CreateBookingSchema>

export const CheckInBookingSchema = Schema.Struct({
  nfcTagId: Schema.Trim.pipe(Schema.minLength(1)),
})
export type CheckInBooking = Schema.Schema.Type<typeof CheckInBookingSchema>

export const BookingDetailSchema = Schema.Struct({
  id: BookingId,
  machineId: MachineId,
  machineName: Schema.String,
  atelierId: AtelierId,
  atelierName: Schema.String,
  atelierSlug: Schema.String,
  startAt: Schema.DateTimeUtc,
  endAt: Schema.DateTimeUtc,
  status: BookingStatusSchema,
  checkedInAt: Schema.NullOr(Schema.DateTimeUtc),
  cancelledAt: Schema.NullOr(Schema.DateTimeUtc),
  canCancel: Schema.Boolean,
  canCheckIn: Schema.Boolean,
})
export type BookingDetail = Schema.Schema.Type<typeof BookingDetailSchema>

export const AtelierBookingSchema = Schema.Struct({
  id: BookingId,
  machineId: MachineId,
  machineName: Schema.String,
  atelierId: AtelierId,
  atelierName: Schema.String,
  userId: UserId,
  memberName: Schema.String,
  startAt: Schema.DateTimeUtc,
  endAt: Schema.DateTimeUtc,
  status: BookingStatusSchema,
  checkedInAt: Schema.NullOr(Schema.DateTimeUtc),
  checkedInVia: Schema.NullOr(CheckInMethodSchema),
  canCheckIn: Schema.Boolean,
  canMarkNoShow: Schema.Boolean,
})
export type AtelierBooking = Schema.Schema.Type<typeof AtelierBookingSchema>

export const AtelierBookingsParamsSchema = Schema.Struct({
  date: Schema.optional(Schema.DateTimeUtc),
  status: Schema.optional(BookingStatusSchema),
})
export type AtelierBookingsParams = Schema.Schema.Type<typeof AtelierBookingsParamsSchema>

export const StatsPeriodSchema = Schema.Literal(StatsPeriod.WEEK, StatsPeriod.MONTH, StatsPeriod.QUARTER)

export const MachineUsageSchema = Schema.Struct({
  machineId: MachineId,
  machineName: Schema.String,
  bookings: Schema.Int,
  bookedHours: Schema.Number,
  occupancyRate: Schema.Number,
  noShows: Schema.Int,
})
export type MachineUsage = Schema.Schema.Type<typeof MachineUsageSchema>

export const AtelierStatsSchema = Schema.Struct({
  atelierId: AtelierId,
  atelierName: Schema.String,
  period: StatsPeriodSchema,
  from: Schema.DateTimeUtc,
  to: Schema.DateTimeUtc,
  openHours: Schema.Number,
  bookings: Schema.Int,
  bookedHours: Schema.Number,
  consumedHours: Schema.Number,
  noShows: Schema.Int,
  cancellations: Schema.Int,
  occupancyRate: Schema.Number,
  machines: Schema.Array(MachineUsageSchema),
})
export type AtelierStats = Schema.Schema.Type<typeof AtelierStatsSchema>

export const AtelierStatsParamsSchema = Schema.Struct({
  period: Schema.optional(StatsPeriodSchema),
})
export type AtelierStatsParams = Schema.Schema.Type<typeof AtelierStatsParamsSchema>

export const NetworkStatsSchema = Schema.Struct({
  period: StatsPeriodSchema,
  from: Schema.DateTimeUtc,
  to: Schema.DateTimeUtc,
  ateliers: Schema.Int,
  machines: Schema.Int,
  openHours: Schema.Number,
  bookings: Schema.Int,
  bookedHours: Schema.Number,
  consumedHours: Schema.Number,
  noShows: Schema.Int,
  cancellations: Schema.Int,
  occupancyRate: Schema.Number,
  byAtelier: Schema.Array(AtelierStatsSchema),
})
export type NetworkStats = Schema.Schema.Type<typeof NetworkStatsSchema>
