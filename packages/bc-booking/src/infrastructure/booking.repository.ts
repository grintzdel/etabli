import type { RepoError } from '@etabli/shared/errors'
import type { BookingId, MachineId, UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as DateTime from 'effect/DateTime'
import type * as Effect from 'effect/Effect'

import type { CheckInMethod } from '../domain/booking.constants'
import type { Booking } from '../domain/booking.schema'
import type { BookingOverlapError } from '../domain/errors'

export interface BookingRepositoryService {
  readonly findById: (id: BookingId) => Effect.Effect<Booking | null, RepoError>
  readonly listActiveForMachineBetween: (
    machineId: MachineId,
    from: DateTime.Utc,
    to: DateTime.Utc
  ) => Effect.Effect<ReadonlyArray<Booking>, RepoError>
  readonly listForUser: (userId: UserId) => Effect.Effect<ReadonlyArray<Booking>, RepoError>
  readonly insert: (booking: Booking) => Effect.Effect<Booking, RepoError | BookingOverlapError>
  readonly cancel: (id: BookingId, at: DateTime.Utc, by: UserId) => Effect.Effect<Booking | null, RepoError>
  readonly checkIn: (id: BookingId, at: DateTime.Utc, via: CheckInMethod) => Effect.Effect<Booking | null, RepoError>
}

export class BookingRepository extends Context.Tag('@etabli/BookingRepository')<
  BookingRepository,
  BookingRepositoryService
>() {}
