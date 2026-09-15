import type * as DateTime from 'effect/DateTime'

import type { AtelierBooking, Booking } from './booking.schema'
import { isCheckInOpen } from './check-in'

export interface AtelierBookingNaming {
  readonly machineName: string
  readonly atelierName: string
}

export const UNKNOWN_MEMBER = 'Compte supprimé'

export const toAtelierBooking = (
  booking: Booking,
  naming: AtelierBookingNaming,
  memberName: string | undefined,
  now: DateTime.Utc
): AtelierBooking => ({
  id: booking.id,
  machineId: booking.machineId,
  machineName: naming.machineName,
  atelierId: booking.atelierId,
  atelierName: naming.atelierName,
  userId: booking.userId,
  memberName: memberName ?? UNKNOWN_MEMBER,
  startAt: booking.startAt,
  endAt: booking.endAt,
  status: booking.status,
  checkedInAt: booking.checkedInAt,
  checkedInVia: booking.checkedInVia,
  canCheckIn: isCheckInOpen(booking, now),
})
