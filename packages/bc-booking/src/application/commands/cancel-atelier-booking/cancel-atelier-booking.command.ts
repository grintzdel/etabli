import { AuthContext, isFabmanagerOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toAtelierBooking } from '../../../domain/atelier-booking'
import type { AtelierBooking } from '../../../domain/booking.schema'
import { isCancellableByAtelier } from '../../../domain/cancellation'
import { BookingNotCancellableError, BookingUnknownError } from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'
import { MemberRoster } from '../../ports/member-roster'

export const cancelAtelierBooking = (
  bookingId: BookingId
): Effect.Effect<
  AtelierBooking,
  BookingNotCancellableError | BookingUnknownError | RepoError,
  AuthContext | BookingRepository | MachineCatalog | MemberRoster | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const roster = yield* MemberRoster
    const clock = yield* Clock

    const unknown = new BookingUnknownError({ bookingId })

    const booking = yield* repository.findById(bookingId)
    if (booking === null || !isFabmanagerOf(auth, booking.atelierId)) return yield* Effect.fail(unknown)

    const machine = yield* catalog.find(booking.machineId)
    if (machine === null) return yield* Effect.fail(unknown)

    const now = yield* clock.now
    if (!isCancellableByAtelier(booking, now)) {
      return yield* Effect.fail(new BookingNotCancellableError({ bookingId }))
    }

    const cancelled = yield* repository.cancel(bookingId, now, auth.userId)
    if (cancelled === null) return yield* Effect.fail(unknown)

    const names = yield* roster.namesOf([cancelled.userId])
    return toAtelierBooking(cancelled, machine, names.get(cancelled.userId), now)
  })
