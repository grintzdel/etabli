import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'

import { toBookingDetail } from '../../../domain/booking-detail'
import { BookingStatus, CheckInMethod } from '../../../domain/booking.constants'
import type { BookingDetail, CheckInBooking } from '../../../domain/booking.schema'
import { checkInWindow, isWithinCheckInWindow } from '../../../domain/check-in'
import {
  BookingNotCheckInableError,
  BookingUnknownError,
  CheckInWindowClosedError,
  NfcTagMismatchError,
} from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

export const checkInBooking = (
  bookingId: BookingId,
  input: CheckInBooking
): Effect.Effect<
  BookingDetail,
  BookingNotCheckInableError | BookingUnknownError | CheckInWindowClosedError | NfcTagMismatchError | RepoError,
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

    if (machine.nfcTagId !== input.nfcTagId) {
      return yield* Effect.fail(new NfcTagMismatchError({ bookingId, machineId: booking.machineId }))
    }

    const checkedIn = yield* repository.checkIn(bookingId, now, CheckInMethod.NFC)
    if (checkedIn === null) return yield* Effect.fail(new BookingUnknownError({ bookingId }))

    return toBookingDetail(checkedIn, machine, now)
  })
