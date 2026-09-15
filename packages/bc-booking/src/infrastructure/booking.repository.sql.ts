import * as SqlClient from '@effect/sql/SqlClient'
import type { SqlError } from '@effect/sql/SqlError'
import { RepoError } from '@etabli/shared/errors'
import type { BookingId, MachineId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { CheckInMethod } from '../domain/booking.constants'
import { ACTIVE_BOOKING_STATUSES, BookingStatus } from '../domain/booking.constants'
import type { Booking } from '../domain/booking.schema'
import { BookingOverlapError } from '../domain/errors'
import { BookingRepository } from './booking.repository'

interface BookingRow {
  readonly id: string
  readonly machine_id: string
  readonly atelier_id: string
  readonly user_id: string
  readonly start_at: Date
  readonly end_at: Date
  readonly status: string
  readonly checked_in_at: Date | null
  readonly checked_in_via: string | null
  readonly cancelled_at: Date | null
  readonly cancelled_by: string | null
  readonly created_at: Date
  readonly updated_at: Date
}

const toBooking = (row: BookingRow): Booking => ({
  id: row.id as Booking['id'],
  machineId: row.machine_id as Booking['machineId'],
  atelierId: row.atelier_id as Booking['atelierId'],
  userId: row.user_id as Booking['userId'],
  startAt: DateTime.unsafeFromDate(row.start_at),
  endAt: DateTime.unsafeFromDate(row.end_at),
  status: row.status as Booking['status'],
  checkedInAt: row.checked_in_at === null ? null : DateTime.unsafeFromDate(row.checked_in_at),
  checkedInVia: row.checked_in_via === null ? null : (row.checked_in_via as Booking['checkedInVia']),
  cancelledAt: row.cancelled_at === null ? null : DateTime.unsafeFromDate(row.cancelled_at),
  cancelledBy: row.cancelled_by === null ? null : (row.cancelled_by as Booking['userId']),
  createdAt: DateTime.unsafeFromDate(row.created_at),
  updatedAt: DateTime.unsafeFromDate(row.updated_at),
})

const fail = (operation: string) => (cause: unknown) => new RepoError({ cause, operation })

const EXCLUSION_VIOLATION = '23P01'
const OVERLAP_CONSTRAINT = 'bookings_no_overlap'

const isOverlapViolation = (error: SqlError): boolean => {
  const cause: unknown = error.cause
  const code = typeof cause === 'object' && cause !== null ? (cause as { readonly code?: unknown }).code : undefined
  return code === EXCLUSION_VIOLATION || String(cause).includes(OVERLAP_CONSTRAINT)
}

export const makeBookingRepositorySql = (sql: SqlClient.SqlClient) =>
  BookingRepository.of({
    findById: (id: BookingId) =>
      sql<BookingRow>`SELECT * FROM bookings WHERE id = ${id} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toBooking(rows[0]))),
        Effect.mapError(fail('bookings.findById'))
      ),

    listActiveForMachineBetween: (machineId: MachineId, from, to) =>
      sql<BookingRow>`
        SELECT * FROM bookings
        WHERE machine_id = ${machineId}
          AND status IN ${sql.in([...ACTIVE_BOOKING_STATUSES])}
          AND start_at < ${DateTime.toDate(to)}
          AND end_at > ${DateTime.toDate(from)}
        ORDER BY start_at ASC
      `.pipe(
        Effect.map((rows) => rows.map(toBooking)),
        Effect.mapError(fail('bookings.listActiveForMachineBetween'))
      ),

    listForUser: (userId: UserId) =>
      sql<BookingRow>`SELECT * FROM bookings WHERE user_id = ${userId} ORDER BY start_at DESC`.pipe(
        Effect.map((rows) => rows.map(toBooking)),
        Effect.mapError(fail('bookings.listForUser'))
      ),

    insert: (booking) =>
      sql<BookingRow>`
        INSERT INTO bookings (
          id, machine_id, atelier_id, user_id, start_at, end_at, status,
          checked_in_at, checked_in_via, cancelled_at, cancelled_by, created_at, updated_at
        )
        VALUES (
          ${booking.id}, ${booking.machineId}, ${booking.atelierId}, ${booking.userId},
          ${DateTime.toDate(booking.startAt)}, ${DateTime.toDate(booking.endAt)}, ${booking.status},
          ${booking.checkedInAt === null ? null : DateTime.toDate(booking.checkedInAt)}, ${booking.checkedInVia},
          ${booking.cancelledAt === null ? null : DateTime.toDate(booking.cancelledAt)}, ${booking.cancelledBy},
          ${DateTime.toDate(booking.createdAt)}, ${DateTime.toDate(booking.updatedAt)}
        )
        RETURNING *
      `.pipe(
        Effect.mapError((error): BookingOverlapError | RepoError =>
          isOverlapViolation(error)
            ? new BookingOverlapError({ machineId: booking.machineId })
            : new RepoError({ cause: error, operation: 'bookings.insert' })
        ),
        Effect.flatMap((rows) =>
          rows[0] === undefined
            ? Effect.fail(new RepoError({ cause: 'no row returned', operation: 'bookings.insert' }))
            : Effect.succeed(toBooking(rows[0]))
        )
      ),

    checkIn: (id: BookingId, at, via: CheckInMethod) =>
      sql<BookingRow>`
        UPDATE bookings
        SET status = ${BookingStatus.CHECKED_IN},
            checked_in_at = ${DateTime.toDate(at)},
            checked_in_via = ${via},
            updated_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toBooking(rows[0]))),
        Effect.mapError(fail('bookings.checkIn'))
      ),

    cancel: (id: BookingId, at, by: UserId) =>
      sql<BookingRow>`
        UPDATE bookings
        SET status = ${BookingStatus.CANCELLED},
            cancelled_at = ${DateTime.toDate(at)},
            cancelled_by = ${by},
            updated_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toBooking(rows[0]))),
        Effect.mapError(fail('bookings.cancel'))
      ),
  })

export const BookingRepositorySqlLayer = Layer.effect(
  BookingRepository,
  Effect.map(SqlClient.SqlClient, makeBookingRepositorySql)
)
