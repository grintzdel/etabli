import * as DateTime from 'effect/DateTime'

import { localMidnight } from './availability'
import { BookingStatus, CLOSING_HOUR, OPENING_HOUR } from './booking.constants'

const HOUR_IN_MILLIS = 3_600_000

export interface UsageWindow {
  readonly from: DateTime.Utc
  readonly to: DateTime.Utc
}

export interface UsageRange {
  readonly startAt: DateTime.Utc
  readonly endAt: DateTime.Utc
}

export const HELD_BOOKING_STATUSES: ReadonlyArray<BookingStatus> = [
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
]

export const statsWindow = (now: DateTime.Utc, days: number): UsageWindow => ({
  from: DateTime.toUtc(localMidnight(now, -(days - 1))),
  to: DateTime.toUtc(localMidnight(now, 1)),
})

export const overlapHours = (range: UsageRange, window: UsageWindow): number => {
  const from = Math.max(DateTime.toEpochMillis(range.startAt), DateTime.toEpochMillis(window.from))
  const to = Math.min(DateTime.toEpochMillis(range.endAt), DateTime.toEpochMillis(window.to))
  return to <= from ? 0 : (to - from) / HOUR_IN_MILLIS
}

export const openHours = (window: UsageWindow): number => {
  const closesAtMillis = DateTime.toEpochMillis(window.to)
  let total = 0

  for (let day = 0; ; day += 1) {
    const midnight = localMidnight(window.from, day)
    const opensAt = DateTime.toUtc(DateTime.add(midnight, { hours: OPENING_HOUR }))
    if (DateTime.toEpochMillis(opensAt) >= closesAtMillis) return total
    total += overlapHours(
      { startAt: opensAt, endAt: DateTime.toUtc(DateTime.add(midnight, { hours: CLOSING_HOUR })) },
      window
    )
  }
}
