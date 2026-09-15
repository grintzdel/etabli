import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { fabmanagedAtelierIds } from '../../../../shared/domain/permissions.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { DEFAULT_STATS_PERIOD, STATS_PERIOD_DAYS } from '../../domain/constants/booking.constant.ts'
import { type AtelierStats, statsWindow, toAtelierStats } from '../../domain/entities/atelier-stats.entity.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'
import type { StatsQuery } from '../../presentation/dtos/stats.request.dto.ts'

@Injectable()
export class GetAtelierStatsUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, query: StatsQuery): Promise<ReadonlyArray<AtelierStats>> {
    const fabmanaged = fabmanagedAtelierIds(user)
    if (fabmanaged.length === 0) return []

    const now = this.clock.now()
    const period = query.period ?? DEFAULT_STATS_PERIOD
    const window = statsWindow(now, STATS_PERIOD_DAYS[period])

    const machines = await this.machineRepository.listForAteliers(fabmanaged)
    const bookings = await this.bookingRepository.listForAteliersBetween(fabmanaged, window.from, window.to)

    return fabmanaged
      .flatMap((atelierId) => {
        const park = machines.filter((machine) => machine.atelierId === atelierId)
        const first = park[0]
        return first === undefined
          ? []
          : [
              toAtelierStats({
                atelierId,
                atelierName: first.atelierName,
                machines: park,
                bookings,
                period,
                window,
                now,
              }),
            ]
      })
      .toSorted((left, right) => left.atelierName.localeCompare(right.atelierName, 'fr'))
  }
}
