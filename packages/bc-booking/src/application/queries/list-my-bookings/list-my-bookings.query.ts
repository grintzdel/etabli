import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toBookingDetail } from '../../../domain/booking-detail'
import type { BookingDetail } from '../../../domain/booking.schema'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

export const listMyBookings = (): Effect.Effect<
  ReadonlyArray<BookingDetail>,
  RepoError,
  AuthContext | BookingRepository | MachineCatalog | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const clock = yield* Clock

    const bookings = yield* repository.listForUser(auth.userId)
    if (bookings.length === 0) return []

    const now = yield* clock.now
    const machines = yield* catalog.findMany(bookings.map((booking) => booking.machineId))
    const byId = new Map(machines.map((machine) => [machine.machineId, machine]))

    return bookings.flatMap((booking) => {
      const machine = byId.get(booking.machineId)
      return machine === undefined ? [] : [toBookingDetail(booking, machine, now)]
    })
  })
