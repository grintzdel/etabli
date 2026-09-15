import type { AtelierId, MachineId } from '@etabli/shared/schema'
import type * as DateTime from 'effect/DateTime'

import { BookableMachineStatus, BookingStatus, type StatsPeriod } from './booking.constants'
import type { AtelierStats, Booking, MachineUsage } from './booking.schema'
import { effectiveStatus } from './completion'
import { openHours, overlapHours, type UsageWindow } from './usage'

export interface UsageMachine {
  readonly machineId: MachineId
  readonly machineName: string
  readonly status: BookableMachineStatus
}

export interface AtelierStatsInput {
  readonly atelierId: AtelierId
  readonly atelierName: string
  readonly machines: ReadonlyArray<UsageMachine>
  readonly bookings: ReadonlyArray<Booking>
  readonly period: StatsPeriod
  readonly window: UsageWindow
  readonly now: DateTime.Utc
}

const round = (value: number, decimals: number): number => Number(value.toFixed(decimals))

const rate = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : round(numerator / denominator, 3)

export const toAtelierStats = ({
  atelierId,
  atelierName,
  machines,
  bookings,
  period,
  window,
  now,
}: AtelierStatsInput): AtelierStats => {
  const park = machines.filter((machine) => machine.status !== BookableMachineStatus.RETIRED)
  const inPark = new Set(park.map((machine) => machine.machineId))
  const kept = bookings.filter((booking) => booking.atelierId === atelierId && inPark.has(booking.machineId))
  const open = openHours(window)

  const held = kept.filter((booking) => booking.status !== BookingStatus.CANCELLED)
  const hoursOf = (booking: Booking): number => overlapHours(booking, window)

  const usage = park.map((machine): MachineUsage => {
    const mine = held.filter((booking) => booking.machineId === machine.machineId)
    const hours = round(
      mine.reduce((total, booking) => total + hoursOf(booking), 0),
      2
    )
    return {
      machineId: machine.machineId,
      machineName: machine.machineName,
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
      .filter((booking) => effectiveStatus(booking, now) === BookingStatus.COMPLETED)
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
