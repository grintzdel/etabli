import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { toBookingDetail } from '../../../domain/booking-detail'
import type { BookingDetail } from '../../../domain/booking.schema'
import { BookingUnknownError } from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

export const getBookingDetail = (
  bookingId: BookingId
): Effect.Effect<
  BookingDetail,
  BookingUnknownError | RepoError,
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

    return toBookingDetail(booking, machine, yield* clock.now)
  })
