import * as DateTime from 'effect/DateTime'
import { describe, expect, it } from 'vitest'

import { at } from '../__tests__/booking.test-layer'
import { availabilityWindow, buildSlots } from './availability'
import { AVAILABILITY_DAYS, SlotReason } from './booking.constants'

const iso = (value: DateTime.Utc): string => DateTime.formatIso(value)

const slotsOn = (slots: ReadonlyArray<{ readonly startAt: DateTime.Utc }>, day: string) =>
  slots.filter((slot) => iso(slot.startAt).startsWith(day))

const build = (options: Partial<Parameters<typeof buildSlots>[0]> = {}) =>
  buildSlots({
    from: at('2026-03-02T00:00:00Z'),
    now: at('2026-03-01T12:00:00Z'),
    slotDurationMinutes: 60,
    bookings: [],
    machineAvailable: true,
    ...options,
  })

describe('availabilityWindow', () => {
  it('starts at the Paris midnight of the given day and spans a week', () => {
    const window = availabilityWindow(at('2026-03-02T15:20:00Z'))

    expect(iso(window.from)).toBe('2026-03-01T23:00:00.000Z')
    expect(iso(window.to)).toBe('2026-03-08T23:00:00.000Z')
  })
})

describe('buildSlots', () => {
  it('opens one slot per hour between 8h and 22h Paris, every day of the window', () => {
    const slots = build()

    expect(slots).toHaveLength(14 * AVAILABILITY_DAYS)
    expect(iso(slots[0]!.startAt)).toBe('2026-03-02T07:00:00.000Z')
    expect(iso(slots[13]!.endAt)).toBe('2026-03-02T21:00:00.000Z')
  })

  it('cuts the day short rather than closing after 22h', () => {
    const slots = build({ slotDurationMinutes: 480 })

    expect(slotsOn(slots, '2026-03-02')).toHaveLength(1)
  })

  it('keeps the Paris opening hours when summer time starts', () => {
    const slots = build({ from: at('2026-03-27T00:00:00Z'), now: at('2026-03-26T12:00:00Z') })

    expect(slotsOn(slots, '2026-03-28')[0]!.startAt).toStrictEqual(at('2026-03-28T07:00:00Z'))
    expect(slotsOn(slots, '2026-03-29')).toHaveLength(14)
    expect(slotsOn(slots, '2026-03-29')[0]!.startAt).toStrictEqual(at('2026-03-29T06:00:00Z'))
  })

  it('marks a slot already started as past', () => {
    const slots = build({ now: at('2026-03-02T09:30:00Z') })

    expect(slots[0]!.reason).toBe(SlotReason.PAST)
    expect(slots[0]!.available).toBe(false)
    expect(slots[3]!.reason).toBe(SlotReason.FREE)
  })

  it('marks the slots a booking overlaps, and only those', () => {
    const slots = build({
      bookings: [{ startAt: at('2026-03-02T09:30:00Z'), endAt: at('2026-03-02T10:30:00Z') }],
    })

    expect(slots.filter((slot) => slot.reason === SlotReason.BOOKED).map((slot) => iso(slot.startAt))).toEqual([
      '2026-03-02T09:00:00.000Z',
      '2026-03-02T10:00:00.000Z',
    ])
  })

  it('closes the whole week when the machine is not available', () => {
    const slots = build({ machineAvailable: false })

    expect(slots.every((slot) => slot.reason === SlotReason.MACHINE_UNAVAILABLE)).toBe(true)
    expect(slots.some((slot) => slot.available)).toBe(false)
  })
})
