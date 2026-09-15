import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { fabmanagedAtelierIds } from '../../../../shared/domain/permissions.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import { localDayWindow } from '../../domain/entities/availability.entity.ts'
import { type AtelierBooking, toAtelierBooking } from '../../domain/entities/booking-read-model.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'
import type { ListAtelierBookingsQuery } from '../../presentation/dtos/list-atelier-bookings.request.dto.ts'

@Injectable()
export class ListAtelierBookingsUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, query: ListAtelierBookingsQuery): Promise<ReadonlyArray<AtelierBooking>> {
    const fabmanaged = fabmanagedAtelierIds(user)
    if (fabmanaged.length === 0) return []

    const now = this.clock.now()
    const day = localDayWindow(query.date ?? now)

    const bookings = await this.bookingRepository.listForAteliersBetween(fabmanaged, day.from, day.to)
    const kept =
      query.status === undefined
        ? bookings
        : bookings.filter((booking) => booking.effectiveStatus(now) === query.status)
    if (kept.length === 0) return []

    const machines = await this.machineRepository.listForAteliers(fabmanaged)
    const byMachineId = new Map(machines.map((machine) => [machine.id, machine]))
    const names = await this.userRepository.namesOf(kept.map((booking) => booking.userId))

    return kept.flatMap((booking): ReadonlyArray<AtelierBooking> => {
      const machine = byMachineId.get(booking.machineId)
      if (machine === undefined) return []
      return [toAtelierBooking(booking, machine, names.get(booking.userId), now)]
    })
  }
}
