import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { type BookingDetail, toBookingDetail } from '../../domain/entities/booking-read-model.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'

@Injectable()
export class ListMyBookingsUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser): Promise<ReadonlyArray<BookingDetail>> {
    const bookings = await this.bookingRepository.listForUser(user.id)
    if (bookings.length === 0) return []

    const now = this.clock.now()
    const machines = await this.machineRepository.findMany(bookings.map((booking) => booking.machineId))
    const byId = new Map(machines.map((machine) => [machine.id, machine]))

    return bookings.flatMap((booking) => {
      const machine = byId.get(booking.machineId)
      return machine === undefined ? [] : [toBookingDetail(booking, machine, now)]
    })
  }
}
