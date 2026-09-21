import { ATELIER_TIME_ZONE } from './constants/booking.constant.ts'

const PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: ATELIER_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export interface LocalParts {
  readonly year: number
  readonly month: number
  readonly day: number
  readonly hour: number
  readonly minute: number
  readonly second: number
}

export const localParts = (instant: Date): LocalParts => {
  const parts = new Map<string, string>(PARTS.formatToParts(instant).map((part) => [part.type, part.value]))
  const read = (type: string): number => Number(parts.get(type) ?? '0')
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour') % 24,
    minute: read('minute'),
    second: read('second'),
  }
}

const offsetMillisAt = (instant: Date): number => {
  const local = localParts(instant)
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

export const fromLocal = (year: number, month: number, day: number, hour = 0, minute = 0): Date => {
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const firstGuess = wall - offsetMillisAt(new Date(wall))
  return new Date(wall - offsetMillisAt(new Date(firstGuess)))
}

export const localMidnight = (instant: Date, offsetDays = 0): Date => {
  const { year, month, day } = localParts(instant)
  return fromLocal(year, month, day + offsetDays)
}

export const localHourOfDay = (instant: Date, offsetDays: number, hour: number): Date => {
  const { year, month, day } = localParts(instant)
  return fromLocal(year, month, day + offsetDays, hour)
}

export const addMinutes = (instant: Date, minutes: number): Date => new Date(instant.getTime() + minutes * 60_000)
