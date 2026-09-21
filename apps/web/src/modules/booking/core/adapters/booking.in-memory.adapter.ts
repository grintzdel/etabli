import type { BookingDetail, BookingResult, CreateBooking, MachineAvailability } from '../model/booking'
import { BookingFailureCode, failure } from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

export class BookingInMemoryAdapter implements IBookingPort {
  private readonly bookings = new Map<string, BookingDetail>()
  private readonly weeks = new Map<string, MachineAvailability>()
  private readonly owners = new Map<string, string>()
  private counter = 0

  seedAvailability(week: MachineAvailability): void {
    this.weeks.set(week.machineId, week)
  }

  seedBooking(token: string, booking: BookingDetail): void {
    this.bookings.set(booking.id, booking)
    this.owners.set(booking.id, token)
  }

  private mine(token: string, id: string): BookingDetail | undefined {
    return this.owners.get(id) === token ? this.bookings.get(id) : undefined
  }

  async availability(_token: string, machineId: string): Promise<BookingResult<MachineAvailability>> {
    const week = this.weeks.get(machineId)
    if (week === undefined) return failure(BookingFailureCode.MACHINE_NOT_BOOKABLE)
    return { ok: true, value: week }
  }

  async create(token: string, input: CreateBooking): Promise<BookingResult<BookingDetail>> {
    const week = this.weeks.get(input.machineId)
    if (week === undefined) return failure(BookingFailureCode.MACHINE_NOT_BOOKABLE)

    const slot = week.slots.find((candidate) => candidate.startAt === input.startAt)
    if (slot === undefined) return failure(BookingFailureCode.SLOT_IN_THE_PAST)
    if (!slot.available) {
      return failure(slot.reason === 'BOOKED' ? BookingFailureCode.SLOT_TAKEN : BookingFailureCode.SLOT_IN_THE_PAST)
    }

    this.counter += 1
    const booking: BookingDetail = {
      id: `00000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`,
      machineId: week.machineId,
      machineName: week.machineName,
      atelierId: week.atelierId,
      atelierName: week.atelierName,
      atelierSlug: week.atelierSlug,
      startAt: slot.startAt,
      endAt: slot.endAt,
      status: 'CONFIRMED',
      checkedInAt: null,
      cancelledAt: null,
      canCancel: true,
      canCheckIn: false,
    }
    this.bookings.set(booking.id, booking)
    this.owners.set(booking.id, token)

    this.weeks.set(week.machineId, {
      ...week,
      slots: week.slots.map((candidate) =>
        candidate.startAt === slot.startAt ? { ...candidate, available: false, reason: 'BOOKED' } : candidate
      ),
    })

    return { ok: true, value: booking }
  }

  async list(token: string): Promise<BookingResult<ReadonlyArray<BookingDetail>>> {
    const mine = [...this.bookings.values()].filter((booking) => this.owners.get(booking.id) === token)
    return { ok: true, value: mine }
  }

  async getById(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    const booking = this.mine(token, id)
    if (booking === undefined) return failure(BookingFailureCode.BOOKING_UNKNOWN)
    return { ok: true, value: booking }
  }

  async cancel(token: string, id: string): Promise<BookingResult<BookingDetail>> {
    const booking = this.mine(token, id)
    if (booking === undefined) return failure(BookingFailureCode.BOOKING_UNKNOWN)
    if (!booking.canCancel) return failure(BookingFailureCode.NOT_CANCELLABLE)

    const cancelled: BookingDetail = {
      ...booking,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      canCancel: false,
      canCheckIn: false,
    }
    this.bookings.set(id, cancelled)
    return { ok: true, value: cancelled }
  }
}
