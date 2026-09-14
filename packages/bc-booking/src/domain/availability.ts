import * as DateTime from 'effect/DateTime'

import { ATELIER_TIME_ZONE, AVAILABILITY_DAYS, CLOSING_HOUR, OPENING_HOUR, SlotReason } from './booking.constants'
import type { AvailabilitySlot } from './booking.schema'

const zone = DateTime.zoneUnsafeMakeNamed(ATELIER_TIME_ZONE)

const localDay = (from: DateTime.Utc, offsetDays: number): DateTime.Zoned =>
  DateTime.setZone(from, zone).pipe(DateTime.startOf('day'), DateTime.add({ days: offsetDays }))

export interface AvailabilityWindow {
  readonly from: DateTime.Utc
  readonly to: DateTime.Utc
}

export const availabilityWindow = (from: DateTime.Utc, days: number = AVAILABILITY_DAYS): AvailabilityWindow => ({
  from: DateTime.toUtc(localDay(from, 0)),
  to: DateTime.toUtc(localDay(from, days)),
})

export interface BookedRange {
  readonly startAt: DateTime.Utc
  readonly endAt: DateTime.Utc
}

export interface BuildSlotsOptions {
  readonly from: DateTime.Utc
  readonly now: DateTime.Utc
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
  const nowMillis = DateTime.toEpochMillis(now)
  const booked = bookings.map((booking) => ({
    startAt: DateTime.toEpochMillis(booking.startAt),
    endAt: DateTime.toEpochMillis(booking.endAt),
  }))

  const reasonFor = (startAt: number, endAt: number): SlotReason => {
    if (startAt <= nowMillis) return SlotReason.PAST
    if (!machineAvailable) return SlotReason.MACHINE_UNAVAILABLE
    return booked.some((range) => startAt < range.endAt && range.startAt < endAt) ? SlotReason.BOOKED : SlotReason.FREE
  }

  const slots: Array<AvailabilitySlot> = []

  for (let day = 0; day < days; day += 1) {
    const midnight = localDay(from, day)
    const closingMillis = DateTime.toEpochMillis(DateTime.add(midnight, { hours: CLOSING_HOUR }))
    let startAt = DateTime.toUtc(DateTime.add(midnight, { hours: OPENING_HOUR }))

    for (;;) {
      const endAt = DateTime.add(startAt, { minutes: slotDurationMinutes })
      if (DateTime.toEpochMillis(endAt) > closingMillis) break
      const reason = reasonFor(DateTime.toEpochMillis(startAt), DateTime.toEpochMillis(endAt))
      slots.push({ startAt, endAt, available: reason === SlotReason.FREE, reason })
      startAt = endAt
    }
  }

  return slots
}
