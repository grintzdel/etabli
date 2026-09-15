import * as DateTime from 'effect/DateTime'

import { BookingStatus, CHECK_IN_CLOSES_MINUTES_AFTER, CHECK_IN_OPENS_MINUTES_BEFORE } from './booking.constants'
import type { Booking } from './booking.schema'

export interface CheckInWindow {
  readonly opensAt: DateTime.Utc
  readonly closesAt: DateTime.Utc
}

export const checkInWindow = (booking: Booking): CheckInWindow => ({
  opensAt: DateTime.subtract(booking.startAt, { minutes: CHECK_IN_OPENS_MINUTES_BEFORE }),
  closesAt: DateTime.add(booking.startAt, { minutes: CHECK_IN_CLOSES_MINUTES_AFTER }),
})

export const isWithinCheckInWindow = (booking: Booking, now: DateTime.Utc): boolean => {
  const { opensAt, closesAt } = checkInWindow(booking)
  const at = DateTime.toEpochMillis(now)
  return at >= DateTime.toEpochMillis(opensAt) && at <= DateTime.toEpochMillis(closesAt)
}

export const isCheckInOpen = (booking: Booking, now: DateTime.Utc): boolean =>
  booking.status === BookingStatus.CONFIRMED && isWithinCheckInWindow(booking, now)
