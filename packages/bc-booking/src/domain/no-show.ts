import * as DateTime from 'effect/DateTime'

import { BookingStatus } from './booking.constants'
import type { Booking } from './booking.schema'
import { checkInWindow } from './check-in'

export const isNoShowMarkable = (booking: Booking, now: DateTime.Utc): boolean =>
  booking.status === BookingStatus.CONFIRMED &&
  DateTime.toEpochMillis(now) > DateTime.toEpochMillis(checkInWindow(booking).closesAt)
