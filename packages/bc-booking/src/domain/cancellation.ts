import * as DateTime from 'effect/DateTime'

import { BookingStatus } from './booking.constants'
import type { Booking } from './booking.schema'

export const isCancellable = (booking: Booking, now: DateTime.Utc): boolean =>
  booking.status === BookingStatus.CONFIRMED && DateTime.toEpochMillis(now) < DateTime.toEpochMillis(booking.startAt)

export const isCancellableByAtelier = (booking: Booking, now: DateTime.Utc): boolean =>
  booking.status === BookingStatus.CONFIRMED && DateTime.toEpochMillis(now) < DateTime.toEpochMillis(booking.endAt)
