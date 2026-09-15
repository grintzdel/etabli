import { describe, expect, it } from 'vitest'

import { at, bookingFixture, FORGE, machineFixture } from '../__tests__/booking.test-layer'
import { toAtelierStats } from './atelier-stats'
import { BookableMachineStatus, BookingStatus, StatsPeriod } from './booking.constants'
import { statsWindow } from './usage'

const NOW = at('2026-03-10T22:30:00Z')
const WINDOW = statsWindow(NOW, 7)
const TROTEC = machineFixture({ machineName: 'Trotec' })
const PRUSA = machineFixture({ machineName: 'Prusa' })

const slot = (day: string, hours = 1, overrides = {}) =>
  bookingFixture({
    machineId: TROTEC.machineId,
    startAt: at(`${day}T09:00:00Z`),
    endAt: at(`${day}T${String(9 + hours).padStart(2, '0')}:00:00Z`),
    ...overrides,
  })

const project = (bookings: ReadonlyArray<ReturnType<typeof bookingFixture>>, machines = [TROTEC, PRUSA]) =>
  toAtelierStats({
    atelierId: FORGE,
    atelierName: 'La Forge',
    machines,
    bookings,
    period: StatsPeriod.WEEK,
    window: WINDOW,
    now: NOW,
  })

describe('toAtelierStats', () => {
  it('measures nothing on an atelier nobody booked', () => {
    const stats = project([])

    expect(stats.bookings).toBe(0)
    expect(stats.bookedHours).toBe(0)
    expect(stats.occupancyRate).toBe(0)
    expect(stats.machines.map((machine) => machine.machineName)).toStrictEqual(['Trotec', 'Prusa'])
  })

  it('counts the hours a slot held against the hours the atelier was open', () => {
    const stats = project([slot('2026-03-09', 2)])

    expect(stats.bookedHours).toBe(2)
    expect(stats.openHours).toBe(7 * 14)
    expect(stats.occupancyRate).toBe(Number((2 / (7 * 14 * 2)).toFixed(3)))
  })

  it('leaves a called-off slot out of the hours it no longer holds', () => {
    const stats = project([slot('2026-03-09', 2, { status: BookingStatus.CANCELLED })])

    expect(stats.bookedHours).toBe(0)
    expect(stats.cancellations).toBe(1)
    expect(stats.bookings).toBe(0)
  })

  it('holds the hours of a slot nobody came to', () => {
    const stats = project([slot('2026-03-09', 2, { status: BookingStatus.NO_SHOW })])

    expect(stats.bookedHours).toBe(2)
    expect(stats.noShows).toBe(1)
    expect(stats.consumedHours).toBe(0)
  })

  it('counts as consumed only the hours a member stamped and saw through', () => {
    const stats = project([
      slot('2026-03-09', 2, { status: BookingStatus.CHECKED_IN }),
      slot('2026-03-10', 1, { status: BookingStatus.CONFIRMED }),
    ])

    expect(stats.consumedHours).toBe(2)
    expect(stats.bookedHours).toBe(3)
  })

  it('splits the hours machine by machine', () => {
    const stats = project([slot('2026-03-09', 2), slot('2026-03-09', 1, { machineId: PRUSA.machineId })])

    expect(stats.machines.map((machine) => machine.bookedHours)).toStrictEqual([2, 1])
    expect(stats.machines[0]?.occupancyRate).toBe(Number((2 / (7 * 14)).toFixed(3)))
  })

  it('drops a machine out of the park from both sides of the ratio', () => {
    const retired = machineFixture({ machineName: 'Scie', status: BookableMachineStatus.RETIRED })
    const stats = project(
      [slot('2026-03-09', 2), slot('2026-03-09', 4, { machineId: retired.machineId })],
      [TROTEC, retired]
    )

    expect(stats.machines.map((machine) => machine.machineName)).toStrictEqual(['Trotec'])
    expect(stats.bookedHours).toBe(2)
    expect(stats.occupancyRate).toBe(Number((2 / (7 * 14)).toFixed(3)))
  })

  it('clips a slot that started before the span', () => {
    const stats = project([
      bookingFixture({
        machineId: TROTEC.machineId,
        startAt: at('2026-03-03T22:00:00Z'),
        endAt: at('2026-03-04T00:00:00Z'),
      }),
    ])

    expect(stats.bookedHours).toBe(1)
  })
})
