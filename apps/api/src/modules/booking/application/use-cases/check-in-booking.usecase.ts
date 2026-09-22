import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { BookingStatus, CheckInMethod } from '../../domain/constants/booking.constant.ts'
import { type BookingDetail, toBookingDetail } from '../../domain/entities/booking-read-model.ts'
import {
  BookingNotCheckInableError,
  BookingUnknownError,
  CheckInWindowClosedError,
  CheckInTokenMismatchError,
} from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'
import type { CheckInBookingBody } from '../../presentation/dtos/check-in-booking.request.dto.ts'

@Injectable()
export class CheckInBookingUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, bookingId: string, body: CheckInBookingBody): Promise<BookingDetail> {
    const booking = await this.bookingRepository.findById(bookingId)
    if (booking === null || booking.userId !== user.id) throw new BookingUnknownError(bookingId)

    const machine = await this.machineRepository.findById(booking.machineId)
    if (machine === null) throw new BookingUnknownError(bookingId)

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BookingNotCheckInableError(bookingId, booking.status)
    }

    const now = this.clock.now()
    if (!booking.isWithinCheckInWindow(now)) {
      const window = booking.checkInWindow()
      throw new CheckInWindowClosedError(bookingId, window.opensAt, window.closesAt)
    }

    if (machine.checkInToken !== body.checkInToken) throw new CheckInTokenMismatchError(bookingId, booking.machineId)

    const checkedIn = await this.bookingRepository.checkIn(bookingId, now, CheckInMethod.QR)
    if (checkedIn === null) throw new BookingUnknownError(bookingId)

    return toBookingDetail(checkedIn, machine, now)
  }
}
