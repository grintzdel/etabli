import { AuthContext, isPlatformAdmin } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import type { AtelierId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toAtelierStats } from '../../../domain/atelier-stats'
import { DEFAULT_STATS_PERIOD, STATS_PERIOD_DAYS } from '../../../domain/booking.constants'
import type { AtelierStats, AtelierStatsParams, NetworkStats } from '../../../domain/booking.schema'
import { openHours, statsWindow } from '../../../domain/usage'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

const sum = (values: ReadonlyArray<number>): number =>
  Number(values.reduce((total, value) => total + value, 0).toFixed(2))

export const getNetworkStats = (
  params: AtelierStatsParams
): Effect.Effect<NetworkStats, ForbiddenError | RepoError, AuthContext | BookingRepository | MachineCatalog | Clock> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const clock = yield* Clock

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin reads the network' }))
    }

    const now = yield* clock.now
    const period = params.period ?? DEFAULT_STATS_PERIOD
    const window = statsWindow(now, STATS_PERIOD_DAYS[period])
    const open = openHours(window)

    const machines = yield* catalog.listAll()
    const atelierIds = [...new Set(machines.map((machine) => machine.atelierId))] as ReadonlyArray<AtelierId>
    const bookings = yield* repository.listForAteliersBetween(atelierIds, window.from, window.to)

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
  })
