import type { MachineWithAtelier } from '../../../machine/domain/entities/machine.entity.ts'
import { type BookingStatus, type CheckInMethod, UNKNOWN_MEMBER } from '../constants/booking.constant.ts'
import type { BookingEntity } from './booking.entity.ts'

export interface BookingDetail {
  readonly id: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly startAt: Date
  readonly endAt: Date
  readonly status: BookingStatus
  readonly checkedInAt: Date | null
  readonly cancelledAt: Date | null
  readonly canCancel: boolean
  readonly canCheckIn: boolean
}

export interface AtelierBooking {
  readonly id: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly userId: string
  readonly memberName: string
  readonly startAt: Date
  readonly endAt: Date
  readonly status: BookingStatus
  readonly checkedInAt: Date | null
  readonly checkedInVia: CheckInMethod | null
  readonly canCheckIn: boolean
  readonly canMarkNoShow: boolean
  readonly canCancel: boolean
}

export const toBookingDetail = (booking: BookingEntity, machine: MachineWithAtelier, now: Date): BookingDetail => ({
  id: booking.id,
  machineId: booking.machineId,
  machineName: machine.name,
  atelierId: booking.atelierId,
  atelierName: machine.atelierName,
  atelierSlug: machine.atelierSlug,
  startAt: booking.startAt,
  endAt: booking.endAt,
  status: booking.effectiveStatus(now),
  checkedInAt: booking.checkedInAt,
  cancelledAt: booking.cancelledAt,
  canCancel: booking.isCancellable(now),
  canCheckIn: booking.isCheckInOpen(now),
})

export const toAtelierBooking = (
  booking: BookingEntity,
  machine: MachineWithAtelier,
  memberName: string | undefined,
  now: Date
): AtelierBooking => ({
  id: booking.id,
  machineId: booking.machineId,
  machineName: machine.name,
  atelierId: booking.atelierId,
  atelierName: machine.atelierName,
  userId: booking.userId,
  memberName: memberName ?? UNKNOWN_MEMBER,
  startAt: booking.startAt,
  endAt: booking.endAt,
  status: booking.effectiveStatus(now),
  checkedInAt: booking.checkedInAt,
  checkedInVia: booking.checkedInVia,
  canCheckIn: booking.isCheckInOpen(now),
  canMarkNoShow: booking.isNoShowMarkable(now),
  canCancel: booking.isCancellableByAtelier(now),
})
