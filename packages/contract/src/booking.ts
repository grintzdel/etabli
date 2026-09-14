export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type CheckInMethod = 'NFC' | 'MANUAL'

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
