import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isFabmanagerOf } from '../../../../shared/domain/permissions.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import { type AtelierBooking, toAtelierBooking } from '../../domain/entities/booking-read-model.ts'
import { BookingNotCancellableError, BookingUnknownError } from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'

@Injectable()
export class CancelAtelierBookingUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(bookingId: string): Promise<AtelierBooking> {
    const user = this.authContext.user
    const booking = await this.bookingRepository.findById(bookingId)
    if (booking === null || !isFabmanagerOf(user, booking.atelierId)) throw new BookingUnknownError(bookingId)

    const machine = await this.machineRepository.findById(booking.machineId)
    if (machine === null) throw new BookingUnknownError(bookingId)

    const now = this.clock.now()
    if (!booking.isCancellableByAtelier(now)) throw new BookingNotCancellableError(bookingId)

    const cancelled = await this.bookingRepository.cancel(bookingId, now, user.id)
    if (cancelled === null) throw new BookingUnknownError(bookingId)

    const names = await this.userRepository.namesOf([cancelled.userId])
    return toAtelierBooking(cancelled, machine, names.get(cancelled.userId), now)
  }
}
