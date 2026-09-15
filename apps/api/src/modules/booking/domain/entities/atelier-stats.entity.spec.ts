import { describe, expect, it } from 'vitest'

import { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { MachineWithAtelier } from '../../../machine/domain/entities/machine.entity.ts'
import { BookingStatus, CLOSING_HOUR, OPENING_HOUR, StatsPeriod } from '../constants/booking.constant.ts'
import { openHours, overlapHours, statsWindow, toAtelierStats } from './atelier-stats.entity.ts'
import { BookingEntity, type BookingProps } from './booking.entity.ts'

const at = (iso: string): Date => new Date(iso)
const OPEN_PER_DAY = CLOSING_HOUR - OPENING_HOUR
const NOON = at('2026-03-10T11:00:00Z')

describe('statsWindow', () => {
  it('runs from the first midnight of the span to the next one', () => {
    const window = statsWindow(NOON, 7)

    expect(window.from.toISOString()).toBe('2026-03-03T23:00:00.000Z')
    expect(window.to.toISOString()).toBe('2026-03-10T23:00:00.000Z')
  })

  it('counts today as the first of the days', () => {
    expect(statsWindow(NOON, 1).from.toISOString()).toBe('2026-03-09T23:00:00.000Z')
  })

  it('walks over the spring forward without losing an hour of span', () => {
    expect(statsWindow(at('2026-04-01T10:00:00Z'), 7).from.toISOString()).toBe('2026-03-25T23:00:00.000Z')
  })
})

describe('openHours', () => {
  it('counts one opening day per day of the span', () => {
    expect(openHours(statsWindow(NOON, 7))).toBe(7 * OPEN_PER_DAY)
  })

  it('measures the same span whatever the hour of the call', () => {
    expect(openHours(statsWindow(at('2026-03-10T06:00:00Z'), 30))).toBe(openHours(statsWindow(NOON, 30)))
  })

  it('keeps fourteen hours a day across the spring forward', () => {
    expect(openHours(statsWindow(at('2026-04-01T10:00:00Z'), 30))).toBe(30 * OPEN_PER_DAY)
  })
})

describe('overlapHours', () => {
  const window = { from: at('2026-03-10T08:00:00Z'), to: at('2026-03-10T12:00:00Z') }

  it('measures a slot held entirely inside the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T09:00:00Z'), endAt: at('2026-03-10T10:30:00Z') }, window)).toBe(1.5)
  })

  it('clips a slot that started before the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T07:00:00Z'), endAt: at('2026-03-10T09:00:00Z') }, window)).toBe(1)
  })

  it('measures nothing of a slot outside the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T13:00:00Z'), endAt: at('2026-03-10T14:00:00Z') }, window)).toBe(0)
  })
})

const machine = (id: string, status: MachineStatus = MachineStatus.AVAILABLE): MachineWithAtelier => ({
  id,
  atelierId: 'atelier-1',
  name: `machine ${id}`,
  description: '',
  kind: 'LASER_CUTTER',
  requiresCertification: false,
  slotDurationMinutes: 60,
  status,
  nfcTagId: null,
  createdAt: at('2026-03-01T00:00:00Z'),
  updatedAt: at('2026-03-01T00:00:00Z'),
  atelierName: 'La Forge',
  atelierSlug: 'la-forge',
})

const booking = (overrides: Partial<BookingProps>): BookingEntity =>
  BookingEntity.from({
    id: 'booking',
    machineId: 'machine-a',
    atelierId: 'atelier-1',
    userId: 'user-1',
    startAt: at('2026-03-09T09:00:00Z'),
    endAt: at('2026-03-09T10:00:00Z'),
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    checkedInVia: null,
    cancelledAt: null,
    cancelledBy: null,
    createdAt: at('2026-03-01T00:00:00Z'),
    updatedAt: at('2026-03-01T00:00:00Z'),
    ...overrides,
  })

describe('toAtelierStats', () => {
  const window = statsWindow(NOON, 7)
  const base = { atelierId: 'atelier-1', atelierName: 'La Forge', period: StatsPeriod.WEEK, window, now: NOON }

  it('counts held hours and leaves cancellations out of them', () => {
    const stats = toAtelierStats({
      ...base,
      machines: [machine('machine-a')],
      bookings: [booking({ id: 'held' }), booking({ id: 'gone', status: BookingStatus.CANCELLED })],
    })

    expect(stats.bookings).toBe(1)
    expect(stats.bookedHours).toBe(1)
    expect(stats.cancellations).toBe(1)
  })

  it('counts a no-show as booked and never as consumed', () => {
    const stats = toAtelierStats({
      ...base,
      machines: [machine('machine-a')],
      bookings: [booking({ id: 'absent', status: BookingStatus.NO_SHOW })],
    })

    expect(stats.noShows).toBe(1)
    expect(stats.bookedHours).toBe(1)
    expect(stats.consumedHours).toBe(0)
  })

  it('consumes only a slot whose effective status is COMPLETED', () => {
    const stats = toAtelierStats({
      ...base,
      machines: [machine('machine-a')],
      bookings: [
        booking({ id: 'done', status: BookingStatus.CHECKED_IN }),
        booking({
          id: 'running',
          status: BookingStatus.CHECKED_IN,
          startAt: at('2026-03-10T10:30:00Z'),
          endAt: at('2026-03-10T11:30:00Z'),
        }),
      ],
    })

    expect(stats.bookedHours).toBe(2)
    expect(stats.consumedHours).toBe(1)
  })

  it('drops a retired machine from both sides of the ratio', () => {
    const stats = toAtelierStats({
      ...base,
      machines: [machine('machine-a'), machine('machine-z', MachineStatus.RETIRED)],
      bookings: [booking({ id: 'on-retired', machineId: 'machine-z' })],
    })

    expect(stats.machines).toHaveLength(1)
    expect(stats.bookings).toBe(0)
    expect(stats.occupancyRate).toBe(Number((0 / (7 * OPEN_PER_DAY)).toFixed(3)))
  })

  it('has no denominator, and so a zero rate, on an atelier without a machine', () => {
    const stats = toAtelierStats({ ...base, machines: [], bookings: [booking({ id: 'orphan' })] })

    expect(stats.occupancyRate).toBe(0)
    expect(stats.machines).toEqual([])
  })
})
