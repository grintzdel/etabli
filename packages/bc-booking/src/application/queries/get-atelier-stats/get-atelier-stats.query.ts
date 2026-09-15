import { AuthContext, MembershipRole } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toAtelierStats } from '../../../domain/atelier-stats'
import { DEFAULT_STATS_PERIOD, STATS_PERIOD_DAYS } from '../../../domain/booking.constants'
import type { AtelierStats, AtelierStatsParams } from '../../../domain/booking.schema'
import { statsWindow } from '../../../domain/usage'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

export const getAtelierStats = (
  params: AtelierStatsParams
): Effect.Effect<ReadonlyArray<AtelierStats>, RepoError, AuthContext | BookingRepository | MachineCatalog | Clock> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const clock = yield* Clock

    const fabmanaged = auth.memberships
      .filter((membership) => membership.role === MembershipRole.FABMANAGER)
      .map((membership) => membership.atelierId)
    if (fabmanaged.length === 0) return []

    const now = yield* clock.now
    const period = params.period ?? DEFAULT_STATS_PERIOD
    const window = statsWindow(now, STATS_PERIOD_DAYS[period])

    const machines = yield* catalog.listForAteliers(fabmanaged)
    const bookings = yield* repository.listForAteliersBetween(fabmanaged, window.from, window.to)

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
  })
