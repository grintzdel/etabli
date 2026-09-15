import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import {
  BookingStatus,
  CHECK_IN_CLOSES_MINUTES_AFTER,
  CHECK_IN_OPENS_MINUTES_BEFORE,
  type CheckInMethod,
} from '../constants/booking.constant.ts'
import { addMinutes } from '../paris-time.ts'

export interface BookingProps {
  readonly id: string
  readonly machineId: string
  readonly atelierId: string
  readonly userId: string
  readonly startAt: Date
  readonly endAt: Date
  readonly status: BookingStatus
  readonly checkedInAt: Date | null
  readonly checkedInVia: CheckInMethod | null
  readonly cancelledAt: Date | null
  readonly cancelledBy: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CheckInWindow {
  readonly opensAt: Date
  readonly closesAt: Date
}

export interface BookableSlot {
  readonly id: string
  readonly user: AuthUser
  readonly machineId: string
  readonly atelierId: string
  readonly slotDurationMinutes: number
  readonly startAt: Date
  readonly now: Date
}

export class BookingEntity {
  private constructor(private readonly props: BookingProps) {}

  static from(props: BookingProps): BookingEntity {
    return new BookingEntity(props)
  }

  static create(slot: BookableSlot): BookingEntity {
    return new BookingEntity({
      id: slot.id,
      machineId: slot.machineId,
      atelierId: slot.atelierId,
      userId: slot.user.id,
      startAt: slot.startAt,
      endAt: addMinutes(slot.startAt, slot.slotDurationMinutes),
      status: BookingStatus.CONFIRMED,
      checkedInAt: null,
      checkedInVia: null,
      cancelledAt: null,
      cancelledBy: null,
      createdAt: slot.now,
      updatedAt: slot.now,
    })
  }

  get id(): string {
    return this.props.id
  }

  get machineId(): string {
    return this.props.machineId
  }

  get atelierId(): string {
    return this.props.atelierId
  }

  get userId(): string {
    return this.props.userId
  }

  get startAt(): Date {
    return this.props.startAt
  }

  get endAt(): Date {
    return this.props.endAt
  }

  get status(): BookingStatus {
    return this.props.status
  }

  get checkedInAt(): Date | null {
    return this.props.checkedInAt
  }

  get checkedInVia(): CheckInMethod | null {
    return this.props.checkedInVia
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt
  }

  checkInWindow(): CheckInWindow {
    return {
      opensAt: addMinutes(this.props.startAt, -CHECK_IN_OPENS_MINUTES_BEFORE),
      closesAt: addMinutes(this.props.startAt, CHECK_IN_CLOSES_MINUTES_AFTER),
    }
  }

  isWithinCheckInWindow(now: Date): boolean {
    const { opensAt, closesAt } = this.checkInWindow()
    return now.getTime() >= opensAt.getTime() && now.getTime() <= closesAt.getTime()
  }

  isCancellable(now: Date): boolean {
    return this.props.status === BookingStatus.CONFIRMED && now.getTime() < this.props.startAt.getTime()
  }

  isCancellableByAtelier(now: Date): boolean {
    return this.props.status === BookingStatus.CONFIRMED && now.getTime() < this.props.endAt.getTime()
  }

  isCheckInOpen(now: Date): boolean {
    return this.props.status === BookingStatus.CONFIRMED && this.isWithinCheckInWindow(now)
  }

  isNoShowMarkable(now: Date): boolean {
    return this.props.status === BookingStatus.CONFIRMED && now.getTime() > this.checkInWindow().closesAt.getTime()
  }

  isCompleted(now: Date): boolean {
    return this.props.status === BookingStatus.CHECKED_IN && now.getTime() >= this.props.endAt.getTime()
  }

  effectiveStatus(now: Date): BookingStatus {
    return this.isCompleted(now) ? BookingStatus.COMPLETED : this.props.status
  }

  toJSON(): BookingProps {
    return this.props
  }
}
