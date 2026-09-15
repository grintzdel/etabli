import type * as DateTime from 'effect/DateTime'

import type { AtelierBooking, Booking } from './booking.schema'
import { isCheckInOpen } from './check-in'
import { effectiveStatus } from './completion'
import { isNoShowMarkable } from './no-show'

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
  status: effectiveStatus(booking, now),
  checkedInAt: booking.checkedInAt,
  checkedInVia: booking.checkedInVia,
  canCheckIn: isCheckInOpen(booking, now),
  canMarkNoShow: isNoShowMarkable(booking, now),
})
