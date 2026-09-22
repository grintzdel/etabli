import { describe, expect, it } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'

import {
  BookingFailureCode,
  FAILURE_MESSAGES,
  failure,
  partitionBookings,
  STATUS_LABELS,
  STATUS_TONES,
} from './booking'

describe('the refusal table', () => {
  it('gives every failure code a French sentence', () => {
    for (const code of Object.values(BookingFailureCode)) {
      expect(FAILURE_MESSAGES[code].length).toBeGreaterThan(0)
    }
  })

  it('tells the five refusals that share a 409 apart', () => {
    const phrases = [
      BookingFailureCode.MACHINE_UNAVAILABLE,
      BookingFailureCode.SLOT_IN_THE_PAST,
      BookingFailureCode.SLOT_TAKEN,
      BookingFailureCode.NOT_CANCELLABLE,
      BookingFailureCode.NOT_CHECK_INABLE,
      BookingFailureCode.CHECK_IN_WINDOW_CLOSED,
      BookingFailureCode.CHECK_IN_TOKEN_MISMATCH,
    ].map((code) => FAILURE_MESSAGES[code])

    expect(new Set(phrases).size).toBe(phrases.length)
  })

  it('carries the phrase with the code', () => {
    expect(failure(BookingFailureCode.CHECK_IN_TOKEN_MISMATCH)).toEqual({
      ok: false,
      error: {
        code: BookingFailureCode.CHECK_IN_TOKEN_MISMATCH,
        message: FAILURE_MESSAGES[BookingFailureCode.CHECK_IN_TOKEN_MISMATCH],
      },
    })
  })

  it('names and tones every booking status', () => {
    for (const status of ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const) {
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0)
      expect(STATUS_TONES[status]).toBeDefined()
    }
  })
})

describe('partitionBookings', () => {
  const now = new Date('2026-09-17T10:00:00.000Z')

  it('keeps an open booking that has not ended in the upcoming half', () => {
    const booking = bookingDetailFixture({ startAt: '2026-09-17T12:00:00.000Z', endAt: '2026-09-17T14:00:00.000Z' })

    expect(partitionBookings([booking], now).upcoming).toEqual([booking])
  })

  it('sends a cancelled booking to the past, whatever its hour', () => {
    const booking = bookingDetailFixture({
      startAt: '2026-09-18T12:00:00.000Z',
      endAt: '2026-09-18T14:00:00.000Z',
      status: 'CANCELLED',
    })

    expect(partitionBookings([booking], now).past).toEqual([booking])
  })

  it('sorts what comes next forward and what is done backward', () => {
    const soon = bookingDetailFixture({ startAt: '2026-09-17T12:00:00.000Z', endAt: '2026-09-17T14:00:00.000Z' })
    const later = bookingDetailFixture({ startAt: '2026-09-19T12:00:00.000Z', endAt: '2026-09-19T14:00:00.000Z' })
    const old = bookingDetailFixture({ startAt: '2026-09-10T12:00:00.000Z', endAt: '2026-09-10T14:00:00.000Z' })
    const older = bookingDetailFixture({ startAt: '2026-09-01T12:00:00.000Z', endAt: '2026-09-01T14:00:00.000Z' })

    const partition = partitionBookings([later, soon, older, old], now)

    expect(partition.upcoming).toEqual([soon, later])
    expect(partition.past).toEqual([old, older])
  })
})
