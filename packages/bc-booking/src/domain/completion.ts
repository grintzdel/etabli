import * as DateTime from 'effect/DateTime'

import { BookingStatus } from './booking.constants'
import type { Booking } from './booking.schema'

export const isCompleted = (booking: Booking, now: DateTime.Utc): boolean =>
  booking.status === BookingStatus.CHECKED_IN && DateTime.toEpochMillis(now) >= DateTime.toEpochMillis(booking.endAt)

export const effectiveStatus = (booking: Booking, now: DateTime.Utc): BookingStatus =>
  isCompleted(booking, now) ? BookingStatus.COMPLETED : booking.status
