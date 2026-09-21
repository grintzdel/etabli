import { Inject, Injectable } from '@nestjs/common'

import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { DEFAULT_STATS_PERIOD, STATS_PERIOD_DAYS } from '../../domain/constants/booking.constant.ts'
import {
  type AtelierStats,
  type NetworkStats,
  openHours,
  statsWindow,
  toAtelierStats,
} from '../../domain/entities/atelier-stats.entity.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'
import type { StatsQuery } from '../../presentation/dtos/stats.request.dto.ts'

const sum = (values: ReadonlyArray<number>): number =>
  Number(values.reduce((total, value) => total + value, 0).toFixed(2))

@Injectable()
export class GetNetworkStatsUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(query: StatsQuery): Promise<NetworkStats> {
    const now = this.clock.now()
    const period = query.period ?? DEFAULT_STATS_PERIOD
    const window = statsWindow(now, STATS_PERIOD_DAYS[period])
    const open = openHours(window)

    const machines = await this.machineRepository.listAll()
    const atelierIds = [...new Set(machines.map((machine) => machine.atelierId))]
    const bookings = await this.bookingRepository.listForAteliersBetween(atelierIds, window.from, window.to)

    const byAtelier: ReadonlyArray<AtelierStats> = atelierIds
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
      .toSorted((left, right) => right.occupancyRate - left.occupancyRate)

    const parkSize = byAtelier.reduce((total, atelier) => total + atelier.machines.length, 0)
    const bookedHours = sum(byAtelier.map((atelier) => atelier.bookedHours))

    return {
      period,
      from: window.from,
      to: window.to,
      ateliers: byAtelier.length,
      machines: parkSize,
      openHours: Number(open.toFixed(2)),
      bookings: byAtelier.reduce((total, atelier) => total + atelier.bookings, 0),
      bookedHours,
      consumedHours: sum(byAtelier.map((atelier) => atelier.consumedHours)),
      noShows: byAtelier.reduce((total, atelier) => total + atelier.noShows, 0),
      cancellations: byAtelier.reduce((total, atelier) => total + atelier.cancellations, 0),
      occupancyRate: parkSize === 0 ? 0 : Number((bookedHours / (open * parkSize)).toFixed(3)),
      byAtelier,
    }
  }
}
