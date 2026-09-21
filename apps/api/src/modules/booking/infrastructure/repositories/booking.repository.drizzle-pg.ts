import { Inject, Injectable } from '@nestjs/common'
import { and, asc, desc, eq, gt, inArray, lt } from 'drizzle-orm'

import { type Database, DATABASE_CONNECTION } from '../../../../infrastructure/database/database.token.ts'
import { bookings } from '../../../../infrastructure/database/schema/index.ts'
import { BaseRepository } from '../../../../shared/infrastructure/base.repository.ts'
import { ACTIVE_BOOKING_STATUSES, BookingStatus, type CheckInMethod } from '../../domain/constants/booking.constant.ts'
import { BookingEntity, type BookingProps } from '../../domain/entities/booking.entity.ts'
import { BookingOverlapError } from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'

type BookingRow = typeof bookings.$inferSelect

const EXCLUSION_VIOLATION = '23P01'
const OVERLAP_CONSTRAINT = 'bookings_no_overlap'

const toBooking = (row: BookingRow): BookingEntity =>
  BookingEntity.from({
    id: row.id,
    machineId: row.machineId,
    atelierId: row.atelierId,
    userId: row.userId,
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status as BookingStatus,
    checkedInAt: row.checkedInAt,
    checkedInVia: row.checkedInVia as CheckInMethod | null,
    cancelledAt: row.cancelledAt,
    cancelledBy: row.cancelledBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })

const isOverlapViolation = (error: unknown): boolean => {
  for (let step: unknown = error; step != null; step = (step as { readonly cause?: unknown }).cause) {
    const carrier = step as { readonly code?: unknown; readonly constraint?: unknown; readonly message?: unknown }
    if (carrier.code === EXCLUSION_VIOLATION || carrier.constraint === OVERLAP_CONSTRAINT) return true
    if (typeof carrier.message === 'string' && carrier.message.includes(OVERLAP_CONSTRAINT)) return true
  }
  return false
}

@Injectable()
export class BookingRepositoryDrizzlePg extends BaseRepository<BookingRow> implements IBookingRepository {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, bookings, bookings.id)
  }

  async findById(id: string): Promise<BookingEntity | null> {
    const row = await this.findRowById(id)
    return row === null ? null : toBooking(row)
  }

  async listActiveForMachineBetween(machineId: string, from: Date, to: Date): Promise<ReadonlyArray<BookingEntity>> {
    const rows = await this.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.machineId, machineId),
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
          lt(bookings.startAt, to),
          gt(bookings.endAt, from)
        )
      )
      .orderBy(asc(bookings.startAt))

    return rows.map(toBooking)
  }

  async listForUser(userId: string): Promise<ReadonlyArray<BookingEntity>> {
    const rows = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startAt))

    return rows.map(toBooking)
  }

  async listForAteliersBetween(
    atelierIds: ReadonlyArray<string>,
    from: Date,
    to: Date
  ): Promise<ReadonlyArray<BookingEntity>> {
    const wanted = [...new Set(atelierIds)]
    if (wanted.length === 0) return []

    const rows = await this.db
      .select()
      .from(bookings)
      .where(and(inArray(bookings.atelierId, wanted), lt(bookings.startAt, to), gt(bookings.endAt, from)))
      .orderBy(asc(bookings.startAt))

    return rows.map(toBooking)
  }

  async insert(booking: BookingProps): Promise<BookingEntity> {
    const rows = await this.db
      .insert(bookings)
      .values({ ...booking })
      .returning()
      .catch((error: unknown) => {
        if (isOverlapViolation(error)) throw new BookingOverlapError(booking.machineId)
        throw error
      })

    const [row] = rows
    if (row === undefined) throw new Error('bookings.insert returned no row')
    return toBooking(row)
  }

  async cancel(id: string, at: Date, by: string): Promise<BookingEntity | null> {
    return this.patch(id, { status: BookingStatus.CANCELLED, cancelledAt: at, cancelledBy: by, updatedAt: at })
  }

  async checkIn(id: string, at: Date, via: CheckInMethod): Promise<BookingEntity | null> {
    return this.patch(id, { status: BookingStatus.CHECKED_IN, checkedInAt: at, checkedInVia: via, updatedAt: at })
  }

  async markNoShow(id: string, at: Date): Promise<BookingEntity | null> {
    return this.patch(id, { status: BookingStatus.NO_SHOW, updatedAt: at })
  }

  private async patch(id: string, values: Partial<typeof bookings.$inferInsert>): Promise<BookingEntity | null> {
    const [row] = await this.db.update(bookings).set(values).where(eq(bookings.id, id)).returning()
    return row === undefined ? null : toBooking(row)
  }
}
