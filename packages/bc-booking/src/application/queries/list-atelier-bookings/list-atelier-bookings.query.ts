import { AuthContext, MembershipRole } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toAtelierBooking } from '../../../domain/atelier-booking'
import { localDayWindow } from '../../../domain/availability'
import type { AtelierBooking, AtelierBookingsParams } from '../../../domain/booking.schema'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'
import { MemberRoster } from '../../ports/member-roster'

export const listAtelierBookings = (
  params: AtelierBookingsParams
): Effect.Effect<
  ReadonlyArray<AtelierBooking>,
  RepoError,
  AuthContext | BookingRepository | MachineCatalog | MemberRoster | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const roster = yield* MemberRoster
    const clock = yield* Clock

    const fabmanaged = auth.memberships
      .filter((membership) => membership.role === MembershipRole.FABMANAGER)
      .map((membership) => membership.atelierId)
    if (fabmanaged.length === 0) return []

    const now = yield* clock.now
    const day = localDayWindow(params.date ?? now)

    const bookings = yield* repository.listForAteliersBetween(fabmanaged, day.from, day.to)
    const kept = params.status === undefined ? bookings : bookings.filter((booking) => booking.status === params.status)
    if (kept.length === 0) return []

    const machines = yield* catalog.listForAteliers(fabmanaged)
    const byMachineId = new Map(machines.map((machine) => [machine.machineId, machine]))
    const names = yield* roster.namesOf(kept.map((booking) => booking.userId))

    return kept.flatMap((booking): ReadonlyArray<AtelierBooking> => {
      const machine = byMachineId.get(booking.machineId)
      if (machine === undefined) return []
      return [toAtelierBooking(booking, machine, names.get(booking.userId), now)]
    })
  })
