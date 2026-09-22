import type { AuthTokenProvider } from '@etabli/api-client'

import type { BookingDetail, BookingResult, CreateBooking, MachineAvailability } from '../model/booking'
import { failure } from '../model/booking'
import type { IBookingPort } from '../ports/booking.port'

export class BookingInMemoryAdapter implements IBookingPort {
  private readonly bookings = new Map<string, BookingDetail>()
  private readonly weeks = new Map<string, MachineAvailability>()
  private readonly owners = new Map<string, string>()
  private readonly tokens = new Map<string, string>()
  private counter = 0

  constructor(private readonly getAuthToken: AuthTokenProvider) {}

  seedAvailability(week: MachineAvailability): void {
    this.weeks.set(week.machineId, week)
  }

  seedBooking(token: string, booking: BookingDetail): void {
    this.bookings.set(booking.id, booking)
    this.owners.set(booking.id, token)
  }

  seedToken(machineId: string, checkInToken: string): void {
    this.tokens.set(machineId, checkInToken)
  }

  private async caller(): Promise<string> {
    return (await this.getAuthToken()) ?? ''
  }

  private async mine(id: string): Promise<BookingDetail | undefined> {
    return this.owners.get(id) === (await this.caller()) ? this.bookings.get(id) : undefined
  }

  async availability(machineId: string): Promise<BookingResult<MachineAvailability>> {
    const week = this.weeks.get(machineId)
    if (week === undefined) return failure('MACHINE_NOT_BOOKABLE')
    return { ok: true, value: week }
  }

  async create(input: CreateBooking): Promise<BookingResult<BookingDetail>> {
    const week = this.weeks.get(input.machineId)
    if (week === undefined) return failure('MACHINE_NOT_BOOKABLE')

    const slot = week.slots.find((candidate) => candidate.startAt === input.startAt)
    if (slot === undefined) return failure('SLOT_IN_THE_PAST')
    if (!slot.available) return failure(slot.reason === 'BOOKED' ? 'SLOT_TAKEN' : 'SLOT_IN_THE_PAST')

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
    this.owners.set(booking.id, await this.caller())

    this.weeks.set(week.machineId, {
      ...week,
      slots: week.slots.map((candidate) =>
        candidate.startAt === slot.startAt ? { ...candidate, available: false, reason: 'BOOKED' } : candidate
      ),
    })

    return { ok: true, value: booking }
  }

  async list(): Promise<BookingResult<ReadonlyArray<BookingDetail>>> {
    const caller = await this.caller()
    return { ok: true, value: [...this.bookings.values()].filter((b) => this.owners.get(b.id) === caller) }
  }

  async getById(id: string): Promise<BookingResult<BookingDetail>> {
    const booking = await this.mine(id)
    if (booking === undefined) return failure('BOOKING_UNKNOWN')
    return { ok: true, value: booking }
  }

  async cancel(id: string): Promise<BookingResult<BookingDetail>> {
    const booking = await this.mine(id)
    if (booking === undefined) return failure('BOOKING_UNKNOWN')
    if (!booking.canCancel) return failure('NOT_CANCELLABLE')

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

  async checkIn(id: string, checkInToken: string): Promise<BookingResult<BookingDetail>> {
    const booking = await this.mine(id)
    if (booking === undefined) return failure('BOOKING_UNKNOWN')
    if (!booking.canCheckIn) return failure('NOT_CHECK_INABLE')
    if (this.tokens.get(booking.machineId) !== checkInToken) return failure('CHECK_IN_TOKEN_MISMATCH')

    const checkedIn: BookingDetail = {
      ...booking,
      status: 'CHECKED_IN',
      checkedInAt: new Date().toISOString(),
      canCheckIn: false,
      canCancel: false,
    }
    this.bookings.set(id, checkedIn)
    return { ok: true, value: checkedIn }
  }
}
