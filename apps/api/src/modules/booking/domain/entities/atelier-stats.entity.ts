import { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { MachineWithAtelier } from '../../../machine/domain/entities/machine.entity.ts'
import { BookingStatus, CLOSING_HOUR, OPENING_HOUR, type StatsPeriod } from '../constants/booking.constant.ts'
import { localHourOfDay, localMidnight } from '../paris-time.ts'
import type { TimeWindow } from './availability.entity.ts'
import type { BookingEntity } from './booking.entity.ts'

const HOUR_IN_MILLIS = 3_600_000

export interface MachineUsage {
  readonly machineId: string
  readonly machineName: string
  readonly bookings: number
  readonly bookedHours: number
  readonly occupancyRate: number
  readonly noShows: number
}

export interface AtelierStats {
  readonly atelierId: string
  readonly atelierName: string
  readonly period: StatsPeriod
  readonly from: Date
  readonly to: Date
  readonly openHours: number
  readonly bookings: number
  readonly bookedHours: number
  readonly consumedHours: number
  readonly noShows: number
  readonly cancellations: number
  readonly occupancyRate: number
  readonly machines: ReadonlyArray<MachineUsage>
}

export interface NetworkStats {
  readonly period: StatsPeriod
  readonly from: Date
  readonly to: Date
  readonly ateliers: number
  readonly machines: number
  readonly openHours: number
  readonly bookings: number
  readonly bookedHours: number
  readonly consumedHours: number
  readonly noShows: number
  readonly cancellations: number
  readonly occupancyRate: number
  readonly byAtelier: ReadonlyArray<AtelierStats>
}

export const statsWindow = (now: Date, days: number): TimeWindow => ({
  from: localMidnight(now, -(days - 1)),
  to: localMidnight(now, 1),
})

export const overlapHours = (range: { readonly startAt: Date; readonly endAt: Date }, window: TimeWindow): number => {
  const from = Math.max(range.startAt.getTime(), window.from.getTime())
  const to = Math.min(range.endAt.getTime(), window.to.getTime())
  return to <= from ? 0 : (to - from) / HOUR_IN_MILLIS
}

export const openHours = (window: TimeWindow): number => {
  const closesAtMillis = window.to.getTime()
  let total = 0

  for (let day = 0; ; day += 1) {
    const opensAt = localHourOfDay(window.from, day, OPENING_HOUR)
    if (opensAt.getTime() >= closesAtMillis) return total
    total += overlapHours({ startAt: opensAt, endAt: localHourOfDay(window.from, day, CLOSING_HOUR) }, window)
  }
}

const round = (value: number, decimals: number): number => Number(value.toFixed(decimals))

const rate = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : round(numerator / denominator, 3)

export interface AtelierStatsInput {
  readonly atelierId: string
  readonly atelierName: string
  readonly machines: ReadonlyArray<MachineWithAtelier>
  readonly bookings: ReadonlyArray<BookingEntity>
  readonly period: StatsPeriod
  readonly window: TimeWindow
  readonly now: Date
}

export const toAtelierStats = ({
  atelierId,
  atelierName,
  machines,
  bookings,
  period,
  window,
  now,
}: AtelierStatsInput): AtelierStats => {
  const park = machines.filter((machine) => machine.status !== MachineStatus.RETIRED)
  const inPark = new Set(park.map((machine) => machine.id))
  const kept = bookings.filter((booking) => booking.atelierId === atelierId && inPark.has(booking.machineId))
  const open = openHours(window)

  const held = kept.filter((booking) => booking.status !== BookingStatus.CANCELLED)
  const hoursOf = (booking: BookingEntity): number => overlapHours(booking, window)

  const usage = park.map((machine): MachineUsage => {
    const mine = held.filter((booking) => booking.machineId === machine.id)
    const hours = round(
      mine.reduce((total, booking) => total + hoursOf(booking), 0),
      2
    )
    return {
      machineId: machine.id,
      machineName: machine.name,
      bookings: mine.length,
      bookedHours: hours,
      occupancyRate: rate(hours, open),
      noShows: mine.filter((booking) => booking.status === BookingStatus.NO_SHOW).length,
    }
  })

  const bookedHours = round(
    held.reduce((total, booking) => total + hoursOf(booking), 0),
    2
  )
  const consumedHours = round(
    held
      .filter((booking) => booking.effectiveStatus(now) === BookingStatus.COMPLETED)
      .reduce((total, booking) => total + hoursOf(booking), 0),
    2
  )

  return {
    atelierId,
    atelierName,
    period,
    from: window.from,
    to: window.to,
    openHours: round(open, 2),
    bookings: held.length,
    bookedHours,
    consumedHours,
    noShows: held.filter((booking) => booking.status === BookingStatus.NO_SHOW).length,
    cancellations: kept.length - held.length,
    occupancyRate: rate(bookedHours, open * park.length),
    machines: usage,
  }
}
