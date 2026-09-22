export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type CheckInMethod = 'QR' | 'MANUAL'

export type BookableMachineStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED'

export type SlotReason = 'FREE' | 'BOOKED' | 'PAST' | 'MACHINE_UNAVAILABLE'

export type Booking = {
  readonly id: string
  readonly machineId: string
  readonly atelierId: string
  readonly userId: string
  readonly startAt: string
  readonly endAt: string
  readonly status: BookingStatus
  readonly checkedInAt: string | null
  readonly checkedInVia: CheckInMethod | null
  readonly cancelledAt: string | null
  readonly cancelledBy: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type AvailabilitySlot = {
  readonly startAt: string
  readonly endAt: string
  readonly available: boolean
  readonly reason: SlotReason
}

export type MachineAvailability = {
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly machineStatus: BookableMachineStatus
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly from: string
  readonly to: string
  readonly slots: ReadonlyArray<AvailabilitySlot>
}

export type AvailabilityQuery = {
  readonly from?: string
}

export type CreateBooking = {
  readonly machineId: string
  readonly startAt: string
}

export type CheckInBooking = {
  readonly checkInToken: string
}

export type BookingDetail = {
  readonly id: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly startAt: string
  readonly endAt: string
  readonly status: BookingStatus
  readonly checkedInAt: string | null
  readonly cancelledAt: string | null
  readonly canCancel: boolean
  readonly canCheckIn: boolean
}

export type AtelierBooking = {
  readonly id: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly userId: string
  readonly memberName: string
  readonly startAt: string
  readonly endAt: string
  readonly status: BookingStatus
  readonly checkedInAt: string | null
  readonly checkedInVia: CheckInMethod | null
  readonly canCheckIn: boolean
  readonly canMarkNoShow: boolean
  readonly canCancel: boolean
}

export type AtelierBookingsQuery = {
  readonly date?: string
  readonly status?: BookingStatus
}

export type StatsPeriod = '7d' | '30d' | '90d'

export type MachineUsage = {
  readonly machineId: string
  readonly machineName: string
  readonly bookings: number
  readonly bookedHours: number
  readonly occupancyRate: number
  readonly noShows: number
}

export type AtelierStats = {
  readonly atelierId: string
  readonly atelierName: string
  readonly period: StatsPeriod
  readonly from: string
  readonly to: string
  readonly openHours: number
  readonly bookings: number
  readonly bookedHours: number
  readonly consumedHours: number
  readonly noShows: number
  readonly cancellations: number
  readonly occupancyRate: number
  readonly machines: ReadonlyArray<MachineUsage>
}

export type AtelierStatsQuery = {
  readonly period?: StatsPeriod
}

export type NetworkStats = {
  readonly period: StatsPeriod
  readonly from: string
  readonly to: string
  readonly ateliers: number
  readonly machines: number
  readonly openHours: number
  readonly bookings: number
  readonly bookedHours: number
  readonly consumedHours: number
  readonly noShows: number
  readonly cancellations: number
  readonly occupancyRate: number
  readonly byAtelier: ReadonlyArray<AtelierStats>
}
