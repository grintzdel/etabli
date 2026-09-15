import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toBookingDetail } from '../../../domain/booking-detail'
import type { BookingDetail } from '../../../domain/booking.schema'
import { isCancellable } from '../../../domain/cancellation'
import { BookingNotCancellableError, BookingUnknownError } from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

export const cancelBooking = (
  bookingId: BookingId
): Effect.Effect<
  BookingDetail,
  BookingNotCancellableError | BookingUnknownError | RepoError,
  AuthContext | BookingRepository | MachineCatalog | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const clock = yield* Clock

    const booking = yield* repository.findById(bookingId)
    if (booking === null || booking.userId !== auth.userId) {
      return yield* Effect.fail(new BookingUnknownError({ bookingId }))
    }

    const machine = yield* catalog.find(booking.machineId)
    if (machine === null) return yield* Effect.fail(new BookingUnknownError({ bookingId }))

    const now = yield* clock.now
    if (!isCancellable(booking, now)) return yield* Effect.fail(new BookingNotCancellableError({ bookingId }))

    const cancelled = yield* repository.cancel(bookingId, now, auth.userId)
    if (cancelled === null) return yield* Effect.fail(new BookingUnknownError({ bookingId }))

    return toBookingDetail(cancelled, machine, now)
  })
