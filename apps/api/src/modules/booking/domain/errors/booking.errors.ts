import { ApiErrorCode } from '@etabli/contract'
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'

export class MachineNotBookableError extends NotFoundException {
  constructor(machineId: string) {
    super({ code: ApiErrorCode.MACHINE_NOT_BOOKABLE, message: `Machine non réservable : ${machineId}`, machineId })
  }
}

export class MachineUnavailableError extends ConflictException {
  constructor(machineId: string, status: string) {
    super({ code: ApiErrorCode.MACHINE_UNAVAILABLE, message: 'Cette machine est indisponible', machineId, status })
  }
}

export class SlotInThePastError extends ConflictException {
  constructor(machineId: string, startAt: Date) {
    super({
      code: ApiErrorCode.SLOT_IN_THE_PAST,
      message: 'Ce créneau est déjà passé',
      machineId,
      startAt: startAt.toISOString(),
    })
  }
}

export class MissingCertificationError extends ForbiddenException {
  constructor(machineId: string) {
    super({ code: ApiErrorCode.MISSING_CERTIFICATION, message: 'Cette machine demande une habilitation', machineId })
  }
}

export class BookingOverlapError extends ConflictException {
  constructor(machineId: string) {
    super({ code: ApiErrorCode.BOOKING_OVERLAP, message: 'Ce créneau vient d’être pris', machineId })
  }
}

export class BookingUnknownError extends NotFoundException {
  constructor(bookingId: string) {
    super({ code: ApiErrorCode.BOOKING_UNKNOWN, message: 'Réservation introuvable', bookingId })
  }
}

export class BookingNotCancellableError extends ConflictException {
  constructor(bookingId: string) {
    super({ code: ApiErrorCode.BOOKING_NOT_CANCELLABLE, message: 'Ce créneau ne peut plus être annulé', bookingId })
  }
}

export class BookingNotCheckInableError extends ConflictException {
  constructor(bookingId: string, status: string) {
    super({
      code: ApiErrorCode.BOOKING_NOT_CHECK_INABLE,
      message: 'Ce créneau ne peut pas être pointé',
      bookingId,
      status,
    })
  }
}

export class CheckInWindowClosedError extends ConflictException {
  constructor(bookingId: string, opensAt: Date, closesAt: Date) {
    super({
      code: ApiErrorCode.CHECK_IN_WINDOW_CLOSED,
      message: 'Le pointage n’est pas ouvert',
      bookingId,
      opensAt: opensAt.toISOString(),
      closesAt: closesAt.toISOString(),
    })
  }
}

export class CheckInTokenMismatchError extends ConflictException {
  constructor(bookingId: string, machineId: string) {
    super({
      code: ApiErrorCode.CHECK_IN_TOKEN_MISMATCH,
      message: 'Ce QR code n’est pas celui de la machine réservée',
      bookingId,
      machineId,
    })
  }
}

export class BookingNotMarkableAsNoShowError extends ConflictException {
  constructor(bookingId: string, status: string) {
    super({
      code: ApiErrorCode.BOOKING_NOT_MARKABLE_AS_NO_SHOW,
      message: 'Ce créneau ne peut pas être marqué comme absence',
      bookingId,
      status,
    })
  }
}
