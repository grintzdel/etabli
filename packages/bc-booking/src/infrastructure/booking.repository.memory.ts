import type { BookingId, MachineId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { ACTIVE_BOOKING_STATUSES, BookingStatus } from '../domain/booking.constants'
import type { Booking } from '../domain/booking.schema'
import { BookingOverlapError } from '../domain/errors'
import type { BookingRepositoryService } from './booking.repository'
import { BookingRepository } from './booking.repository'

export interface BookingRepositoryMemory extends BookingRepositoryService {
  readonly bookings: Map<string, Booking>
}

const isActive = (booking: Booking): boolean => ACTIVE_BOOKING_STATUSES.some((status) => status === booking.status)

const overlaps = (a: Booking, b: Booking): boolean =>
  DateTime.toEpochMillis(a.startAt) < DateTime.toEpochMillis(b.endAt) &&
  DateTime.toEpochMillis(b.startAt) < DateTime.toEpochMillis(a.endAt)

export const makeBookingRepositoryMemory = (): BookingRepositoryMemory => {
  const bookings = new Map<string, Booking>()

  return {
    bookings,
    findById: (id: BookingId) => Effect.sync(() => bookings.get(id) ?? null),
    listActiveForMachineBetween: (machineId: MachineId, from, to) =>
      Effect.sync(() =>
        [...bookings.values()]
          .filter(
            (booking) =>
              booking.machineId === machineId &&
              isActive(booking) &&
              DateTime.toEpochMillis(booking.startAt) < DateTime.toEpochMillis(to) &&
              DateTime.toEpochMillis(booking.endAt) > DateTime.toEpochMillis(from)
          )
          .toSorted((a, b) => DateTime.toEpochMillis(a.startAt) - DateTime.toEpochMillis(b.startAt))
      ),
    listForUser: (userId: UserId) =>
      Effect.sync(() =>
        [...bookings.values()]
          .filter((booking) => booking.userId === userId)
          .toSorted((a, b) => DateTime.toEpochMillis(b.startAt) - DateTime.toEpochMillis(a.startAt))
      ),
    insert: (booking) =>
      Effect.suspend(() => {
        const conflict = [...bookings.values()].some(
          (existing) =>
            existing.machineId === booking.machineId &&
            isActive(existing) &&
            isActive(booking) &&
            overlaps(existing, booking)
        )
        if (conflict) return Effect.fail(new BookingOverlapError({ machineId: booking.machineId }))
        bookings.set(booking.id, booking)
        return Effect.succeed(booking)
      }),
    cancel: (id: BookingId, at, by: UserId) =>
      Effect.sync(() => {
        const existing = bookings.get(id)
        if (existing === undefined) return null
        const cancelled = {
          ...existing,
          status: BookingStatus.CANCELLED,
          cancelledAt: at,
          cancelledBy: by,
          updatedAt: at,
        }
        bookings.set(id, cancelled)
        return cancelled
      }),
  }
}

export const BookingRepositoryMemoryLayer = Layer.sync(BookingRepository, () =>
  BookingRepository.of(makeBookingRepositoryMemory())
)
