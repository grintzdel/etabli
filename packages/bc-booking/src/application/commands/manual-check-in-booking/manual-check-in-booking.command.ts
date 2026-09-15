import { AuthContext, isFabmanagerOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'

import { toAtelierBooking } from '../../../domain/atelier-booking'
import { BookingStatus, CheckInMethod } from '../../../domain/booking.constants'
import type { AtelierBooking } from '../../../domain/booking.schema'
import { checkInWindow, isWithinCheckInWindow } from '../../../domain/check-in'
import { BookingNotCheckInableError, BookingUnknownError, CheckInWindowClosedError } from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'
import { MemberRoster } from '../../ports/member-roster'

export const manualCheckInBooking = (
  bookingId: BookingId
): Effect.Effect<
  AtelierBooking,
  BookingNotCheckInableError | BookingUnknownError | CheckInWindowClosedError | RepoError,
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

    if (booking.status !== BookingStatus.CONFIRMED) {
      return yield* Effect.fail(new BookingNotCheckInableError({ bookingId, status: booking.status }))
    }

    const now = yield* clock.now
    if (!isWithinCheckInWindow(booking, now)) {
      const window = checkInWindow(booking)
      return yield* Effect.fail(
        new CheckInWindowClosedError({
          bookingId,
          opensAt: DateTime.formatIso(window.opensAt),
          closesAt: DateTime.formatIso(window.closesAt),
        })
      )
    }

    const checkedIn = yield* repository.checkIn(bookingId, now, CheckInMethod.MANUAL)
    if (checkedIn === null) return yield* Effect.fail(unknown)

    const names = yield* roster.namesOf([checkedIn.userId])
    return toAtelierBooking(checkedIn, machine, names.get(checkedIn.userId), now)
  })
