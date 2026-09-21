import type { BookingResult } from '../model/booking'
import { BookingFailureCode, failure } from '../model/booking'
import type { AtelierBooking, AtelierBookingsQuery } from '../model/manage-booking'
import type { AtelierStats, AtelierStatsQuery, NetworkStats } from '../model/manage-stats'
import { DEFAULT_STATS_PERIOD } from '../model/manage-stats'
import type { IManageBookingPort } from '../ports/manage-booking.port'

export class ManageBookingInMemoryAdapter implements IManageBookingPort {
  private readonly bookings = new Map<string, AtelierBooking>()

  constructor(
    seed: ReadonlyArray<AtelierBooking> = [],
    private readonly managers: ReadonlyMap<string, ReadonlyArray<string>> = new Map(),
    private readonly rows: ReadonlyArray<AtelierStats> = []
  ) {
    for (const booking of seed) this.bookings.set(booking.id, booking)
  }

  private managed(token: string, booking: AtelierBooking): boolean {
    return (this.managers.get(token) ?? []).includes(booking.atelierId)
  }

  private transition(
    token: string,
    id: string,
    allowed: (booking: AtelierBooking) => boolean,
    refusal: BookingFailureCode,
    patch: (booking: AtelierBooking) => AtelierBooking
  ): BookingResult<AtelierBooking> {
    const current = this.bookings.get(id)
    if (current === undefined || !this.managed(token, current)) return failure(BookingFailureCode.BOOKING_UNKNOWN)
    if (!allowed(current)) return failure(refusal)

    const next = patch(current)
    this.bookings.set(id, next)
    return { ok: true, value: next }
  }

  async list(token: string, query: AtelierBookingsQuery): Promise<BookingResult<ReadonlyArray<AtelierBooking>>> {
    const owned = this.managers.get(token)
    if (owned === undefined) return failure(BookingFailureCode.FORBIDDEN)

    return {
      ok: true,
      value: [...this.bookings.values()].filter(
        (booking) =>
          owned.includes(booking.atelierId) &&
          this.onDate(booking, query.date) &&
          (query.status === undefined || booking.status === query.status)
      ),
    }
  }

  private onDate(booking: AtelierBooking, date: string | undefined): boolean {
    return date === undefined || booking.startAt.slice(0, 10) === date
  }

  async checkIn(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return this.transition(
      token,
      id,
      (booking) => booking.canCheckIn,
      BookingFailureCode.NOT_CHECK_INABLE,
      (booking) => ({
        ...booking,
        status: 'CHECKED_IN',
        checkedInAt: new Date().toISOString(),
        checkedInVia: 'MANUAL',
        canCheckIn: false,
        canMarkNoShow: false,
        canCancel: false,
      })
    )
  }

  async markNoShow(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return this.transition(
      token,
      id,
      (booking) => booking.canMarkNoShow,
      BookingFailureCode.NOT_MARKABLE_AS_NO_SHOW,
      (booking) => ({ ...booking, status: 'NO_SHOW', canCheckIn: false, canMarkNoShow: false, canCancel: false })
    )
  }

  async cancel(token: string, id: string): Promise<BookingResult<AtelierBooking>> {
    return this.transition(
      token,
      id,
      (booking) => booking.canCancel,
      BookingFailureCode.NOT_CANCELLABLE,
      (booking) => ({ ...booking, status: 'CANCELLED', canCheckIn: false, canMarkNoShow: false, canCancel: false })
    )
  }

  async stats(token: string, query: AtelierStatsQuery): Promise<BookingResult<ReadonlyArray<AtelierStats>>> {
    const owned = this.managers.get(token)
    if (owned === undefined) return failure(BookingFailureCode.FORBIDDEN)

    const period = query.period ?? DEFAULT_STATS_PERIOD
    return { ok: true, value: this.rows.filter((row) => owned.includes(row.atelierId) && row.period === period) }
  }

  async networkStats(token: string, query: AtelierStatsQuery): Promise<BookingResult<NetworkStats>> {
    if (!this.managers.has(token)) return failure(BookingFailureCode.FORBIDDEN)

    const period = query.period ?? DEFAULT_STATS_PERIOD
    const byAtelier = this.rows.filter((row) => row.period === period)
    const sum = (pick: (row: AtelierStats) => number): number => byAtelier.reduce((total, row) => total + pick(row), 0)
    const openHours = sum((row) => row.openHours)
    const bookedHours = sum((row) => row.bookedHours)

    return {
      ok: true,
      value: {
        period,
        from: byAtelier[0]?.from ?? '',
        to: byAtelier[0]?.to ?? '',
        ateliers: byAtelier.length,
        machines: byAtelier.reduce((total, row) => total + row.machines.length, 0),
        openHours,
        bookings: sum((row) => row.bookings),
        bookedHours,
        consumedHours: sum((row) => row.consumedHours),
        noShows: sum((row) => row.noShows),
        cancellations: sum((row) => row.cancellations),
        occupancyRate: openHours === 0 ? 0 : bookedHours / openHours,
        byAtelier,
      },
    }
  }
}
