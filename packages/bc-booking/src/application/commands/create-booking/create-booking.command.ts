import { AuthContext, isMemberOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { IdGenerator } from '@etabli/shared/id'
import { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'

import { toBookingDetail } from '../../../domain/booking-detail'
import { BookableMachineStatus, BookingStatus } from '../../../domain/booking.constants'
import type { BookingDetail, CreateBooking } from '../../../domain/booking.schema'
import {
  BookingOverlapError,
  MachineNotBookableError,
  MachineUnavailableError,
  MissingCertificationError,
  SlotInThePastError,
} from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { CertificationChecker } from '../../ports/certification-checker'
import { MachineCatalog } from '../../ports/machine-catalog'

export const createBooking = (
  input: CreateBooking
): Effect.Effect<
  BookingDetail,
  | BookingOverlapError
  | MachineNotBookableError
  | MachineUnavailableError
  | MissingCertificationError
  | SlotInThePastError
  | RepoError,
  AuthContext | BookingRepository | MachineCatalog | CertificationChecker | IdGenerator | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const certifications = yield* CertificationChecker
    const ids = yield* IdGenerator
    const clock = yield* Clock

    const machine = yield* catalog.find(input.machineId)
    if (machine === null || !isMemberOf(auth, machine.atelierId)) {
      return yield* Effect.fail(new MachineNotBookableError({ machineId: input.machineId }))
    }

    if (machine.status !== BookableMachineStatus.AVAILABLE) {
      return yield* Effect.fail(new MachineUnavailableError({ machineId: input.machineId, status: machine.status }))
    }

    const now = yield* clock.now
    if (DateTime.toEpochMillis(input.startAt) <= DateTime.toEpochMillis(now)) {
      return yield* Effect.fail(
        new SlotInThePastError({ machineId: input.machineId, startAt: DateTime.formatIso(input.startAt) })
      )
    }

    if (machine.requiresCertification && !(yield* certifications.isCertified(auth.userId, input.machineId))) {
      return yield* Effect.fail(new MissingCertificationError({ machineId: input.machineId }))
    }

    const booking = yield* repository.insert({
      id: BookingId.make(yield* ids.uuid),
      machineId: input.machineId,
      atelierId: machine.atelierId,
      userId: auth.userId,
      startAt: input.startAt,
      endAt: DateTime.add(input.startAt, { minutes: machine.slotDurationMinutes }),
      status: BookingStatus.CONFIRMED,
      checkedInAt: null,
      checkedInVia: null,
      cancelledAt: null,
      cancelledBy: null,
      createdAt: now,
      updatedAt: now,
    })

    return toBookingDetail(booking, machine, now)
  })
