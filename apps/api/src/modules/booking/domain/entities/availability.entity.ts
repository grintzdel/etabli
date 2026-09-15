import type { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import { AVAILABILITY_DAYS, CLOSING_HOUR, OPENING_HOUR, SlotReason } from '../constants/booking.constant.ts'
import { addMinutes, localHourOfDay, localMidnight } from '../paris-time.ts'

export interface TimeWindow {
  readonly from: Date
  readonly to: Date
}

export interface AvailabilitySlot {
  readonly startAt: Date
  readonly endAt: Date
  readonly available: boolean
  readonly reason: SlotReason
}

export interface MachineAvailability {
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly machineStatus: MachineStatus
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly from: Date
  readonly to: Date
  readonly slots: ReadonlyArray<AvailabilitySlot>
}

export const availabilityWindow = (from: Date, days: number = AVAILABILITY_DAYS): TimeWindow => ({
  from: localMidnight(from, 0),
  to: localMidnight(from, days),
})

export const localDayWindow = (at: Date): TimeWindow => availabilityWindow(at, 1)

export interface BookedRange {
  readonly startAt: Date
  readonly endAt: Date
}

export interface BuildSlotsOptions {
  readonly from: Date
  readonly now: Date
  readonly slotDurationMinutes: number
  readonly bookings: ReadonlyArray<BookedRange>
  readonly machineAvailable: boolean
  readonly days?: number
}

export const buildSlots = ({
  from,
  now,
  slotDurationMinutes,
  bookings,
  machineAvailable,
  days = AVAILABILITY_DAYS,
}: BuildSlotsOptions): ReadonlyArray<AvailabilitySlot> => {
  const nowMillis = now.getTime()
  const booked = bookings.map((booking) => ({
    startAt: booking.startAt.getTime(),
    endAt: booking.endAt.getTime(),
  }))

  const reasonFor = (startAt: number, endAt: number): SlotReason => {
    if (startAt <= nowMillis) return SlotReason.PAST
    if (!machineAvailable) return SlotReason.MACHINE_UNAVAILABLE
    return booked.some((range) => startAt < range.endAt && range.startAt < endAt) ? SlotReason.BOOKED : SlotReason.FREE
  }

  const slots: Array<AvailabilitySlot> = []

  for (let day = 0; day < days; day += 1) {
    const closingMillis = localHourOfDay(from, day, CLOSING_HOUR).getTime()
    let startAt = localHourOfDay(from, day, OPENING_HOUR)

    for (;;) {
      const endAt = addMinutes(startAt, slotDurationMinutes)
      if (endAt.getTime() > closingMillis) break
      const reason = reasonFor(startAt.getTime(), endAt.getTime())
      slots.push({ startAt, endAt, available: reason === SlotReason.FREE, reason })
      startAt = endAt
    }
  }

  return slots
}
