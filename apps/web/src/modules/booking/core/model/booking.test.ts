import { describe, expect, it } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'

import { BookingFailureCode, FAILURE_MESSAGES, failure, isUpcoming, partitionBookings } from './booking'

const NOW = new Date('2026-06-01T12:00:00.000Z')

describe('isUpcoming', () => {
  it('holds while an open booking has not ended', () => {
    const booking = bookingDetailFixture({ startAt: '2026-06-01T11:00:00.000Z', endAt: '2026-06-01T13:00:00.000Z' })
    expect(isUpcoming(booking, NOW)).toBe(true)
  })

  it('drops once the slot is over', () => {
    const booking = bookingDetailFixture({ startAt: '2026-06-01T08:00:00.000Z', endAt: '2026-06-01T10:00:00.000Z' })
    expect(isUpcoming(booking, NOW)).toBe(false)
  })

  it('drops a cancelled booking whose slot is still ahead', () => {
    const booking = bookingDetailFixture({
      startAt: '2026-06-02T08:00:00.000Z',
      endAt: '2026-06-02T10:00:00.000Z',
      status: 'CANCELLED',
    })
    expect(isUpcoming(booking, NOW)).toBe(false)
  })

  it('keeps a booking already checked in', () => {
    const booking = bookingDetailFixture({
      startAt: '2026-06-01T11:00:00.000Z',
      endAt: '2026-06-01T13:00:00.000Z',
      status: 'CHECKED_IN',
    })
    expect(isUpcoming(booking, NOW)).toBe(true)
  })
})

describe('partitionBookings', () => {
  it('puts the soonest slot first and the most recent past first', () => {
    const later = bookingDetailFixture({ startAt: '2026-06-03T08:00:00.000Z', endAt: '2026-06-03T10:00:00.000Z' })
    const sooner = bookingDetailFixture({ startAt: '2026-06-02T08:00:00.000Z', endAt: '2026-06-02T10:00:00.000Z' })
    const old = bookingDetailFixture({ startAt: '2026-05-01T08:00:00.000Z', endAt: '2026-05-01T10:00:00.000Z' })
    const older = bookingDetailFixture({ startAt: '2026-04-01T08:00:00.000Z', endAt: '2026-04-01T10:00:00.000Z' })

    const { upcoming, past } = partitionBookings([old, later, older, sooner], NOW)

    expect(upcoming.map((booking) => booking.id)).toEqual([sooner.id, later.id])
    expect(past.map((booking) => booking.id)).toEqual([old.id, older.id])
  })

  it('leaves the given list untouched', () => {
    const bookings = [
      bookingDetailFixture({ startAt: '2026-06-03T08:00:00.000Z', endAt: '2026-06-03T10:00:00.000Z' }),
      bookingDetailFixture({ startAt: '2026-06-02T08:00:00.000Z', endAt: '2026-06-02T10:00:00.000Z' }),
    ]
    const order = bookings.map((booking) => booking.id)

    partitionBookings(bookings, NOW)

    expect(bookings.map((booking) => booking.id)).toEqual(order)
  })
})

describe('failure', () => {
  it('carries the message that names the broken rule', () => {
    expect(failure(BookingFailureCode.SLOT_TAKEN)).toEqual({
      ok: false,
      error: { code: 'SLOT_TAKEN', message: FAILURE_MESSAGES.SLOT_TAKEN },
    })
  })

  it('gives every code a message of its own', () => {
    const messages = Object.values(FAILURE_MESSAGES)
    expect(new Set(messages).size).toBe(messages.length)
  })
})
