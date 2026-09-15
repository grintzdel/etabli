import type * as DateTime from 'effect/DateTime'

import type { Booking, BookingDetail } from './booking.schema'
import { isCancellable } from './cancellation'
import { isCheckInOpen } from './check-in'

export interface BookingNaming {
  readonly machineName: string
  readonly atelierName: string
  readonly atelierSlug: string
}

export const toBookingDetail = (booking: Booking, naming: BookingNaming, now: DateTime.Utc): BookingDetail => ({
  id: booking.id,
  machineId: booking.machineId,
  machineName: naming.machineName,
  atelierId: booking.atelierId,
  atelierName: naming.atelierName,
  atelierSlug: naming.atelierSlug,
  startAt: booking.startAt,
  endAt: booking.endAt,
  status: booking.status,
  checkedInAt: booking.checkedInAt,
  cancelledAt: booking.cancelledAt,
  canCancel: isCancellable(booking, now),
  canCheckIn: isCheckInOpen(booking, now),
})
