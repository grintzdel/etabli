import { describe, expect, it } from 'vitest'

import { BookingStatus } from '../constants/booking.constant.ts'
import { BookingEntity, type BookingProps } from './booking.entity.ts'

const at = (iso: string): Date => new Date(iso)

const makeBooking = (overrides: Partial<BookingProps> = {}): BookingEntity =>
  BookingEntity.from({
    id: 'booking-1',
    machineId: 'machine-1',
    atelierId: 'atelier-1',
    userId: 'user-1',
    startAt: at('2026-09-16T10:00:00Z'),
    endAt: at('2026-09-16T11:00:00Z'),
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    checkedInVia: null,
    cancelledAt: null,
    cancelledBy: null,
    createdAt: at('2026-09-15T10:00:00Z'),
    updatedAt: at('2026-09-15T10:00:00Z'),
    ...overrides,
  })

describe('BookingEntity.create', () => {
  it('ends the slot after the machine duration and confirms it', () => {
    const booking = BookingEntity.create({
      id: 'booking-2',
      user: { id: 'user-1', platformRole: 'MEMBER', memberships: [] },
      machineId: 'machine-1',
      atelierId: 'atelier-1',
      slotDurationMinutes: 90,
      startAt: at('2026-09-16T10:00:00Z'),
      now: at('2026-09-15T10:00:00Z'),
    })

    expect(booking.endAt.toISOString()).toBe('2026-09-16T11:30:00.000Z')
    expect(booking.status).toBe(BookingStatus.CONFIRMED)
  })
})

describe('isCancellable', () => {
  it('holds until the slot starts', () => {
    expect(makeBooking().isCancellable(at('2026-09-16T09:59:59Z'))).toBe(true)
    expect(makeBooking().isCancellable(at('2026-09-16T10:00:00Z'))).toBe(false)
  })

  it('is closed on a slot already checked in', () => {
    expect(makeBooking({ status: BookingStatus.CHECKED_IN }).isCancellable(at('2026-09-16T09:00:00Z'))).toBe(false)
  })
})

describe('isCancellableByAtelier', () => {
  it('runs to the end of the slot, where the member closes at its start', () => {
    const booking = makeBooking()

    expect(booking.isCancellableByAtelier(at('2026-09-16T10:30:00Z'))).toBe(true)
    expect(booking.isCancellable(at('2026-09-16T10:30:00Z'))).toBe(false)
    expect(booking.isCancellableByAtelier(at('2026-09-16T11:00:00Z'))).toBe(false)
  })

  it('leaves a checked-in slot out of reach on both sides', () => {
    const booking = makeBooking({ status: BookingStatus.CHECKED_IN })

    expect(booking.isCancellableByAtelier(at('2026-09-16T10:30:00Z'))).toBe(false)
    expect(booking.isCancellable(at('2026-09-16T09:00:00Z'))).toBe(false)
  })
})

describe('checkInWindow', () => {
  it('opens fifteen minutes before and closes thirty after the start', () => {
    const { opensAt, closesAt } = makeBooking().checkInWindow()

    expect(opensAt.toISOString()).toBe('2026-09-16T09:45:00.000Z')
    expect(closesAt.toISOString()).toBe('2026-09-16T10:30:00.000Z')
  })
})

describe('isCheckInOpen', () => {
  it('follows the window, on a confirmed slot only', () => {
    expect(makeBooking().isCheckInOpen(at('2026-09-16T09:44:59Z'))).toBe(false)
    expect(makeBooking().isCheckInOpen(at('2026-09-16T09:45:00Z'))).toBe(true)
    expect(makeBooking().isCheckInOpen(at('2026-09-16T10:30:00Z'))).toBe(true)
    expect(makeBooking().isCheckInOpen(at('2026-09-16T10:30:01Z'))).toBe(false)
    expect(makeBooking({ status: BookingStatus.CHECKED_IN }).isCheckInOpen(at('2026-09-16T10:00:00Z'))).toBe(false)
  })
})

describe('isNoShowMarkable', () => {
  it('reads the closing of the check-in window, not the end of the slot', () => {
    expect(makeBooking().isNoShowMarkable(at('2026-09-16T10:30:00Z'))).toBe(false)
    expect(makeBooking().isNoShowMarkable(at('2026-09-16T10:30:01Z'))).toBe(true)
  })

  it('leaves a checked-in slot alone', () => {
    expect(makeBooking({ status: BookingStatus.CHECKED_IN }).isNoShowMarkable(at('2026-09-16T12:00:00Z'))).toBe(false)
  })
})

describe('effectiveStatus', () => {
  it('projects COMPLETED on a checked-in slot whose end has passed', () => {
    const booking = makeBooking({ status: BookingStatus.CHECKED_IN })

    expect(booking.effectiveStatus(at('2026-09-16T10:59:59Z'))).toBe(BookingStatus.CHECKED_IN)
    expect(booking.effectiveStatus(at('2026-09-16T11:00:00Z'))).toBe(BookingStatus.COMPLETED)
  })

  it('never completes a slot nobody checked in', () => {
    expect(makeBooking().effectiveStatus(at('2026-09-17T00:00:00Z'))).toBe(BookingStatus.CONFIRMED)
  })
})
