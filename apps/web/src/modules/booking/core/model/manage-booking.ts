import type { AtelierBooking, AtelierBookingsQuery, BookingStatus, CheckInMethod } from '@etabli/contract'

export type { AtelierBooking, AtelierBookingsQuery, CheckInMethod }

export const CHECK_IN_METHOD_LABELS: Readonly<Record<CheckInMethod, string>> = {
  QR: 'QR code',
  MANUAL: 'À la main',
}

export const BOOKING_STATUSES: ReadonlyArray<BookingStatus> = [
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

const isBookingStatus = (value: string): value is BookingStatus => BOOKING_STATUSES.some((status) => status === value)

export interface BookingDeskFilters {
  readonly day: string
  readonly status?: BookingStatus
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const todayInAtelierTimeZone = (now: Date): string =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(now)

export const parseBookingDeskFilters = (
  params: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>,
  now: Date
): BookingDeskFilters => {
  const first = (key: string): string | undefined => {
    const raw = params[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }

  const day = first('day')
  const status = first('status')

  return {
    day: day !== undefined && DAY_PATTERN.test(day) ? day : todayInAtelierTimeZone(now),
    ...(status !== undefined && isBookingStatus(status) ? { status } : {}),
  }
}

export const toAtelierBookingsQuery = (filters: BookingDeskFilters): AtelierBookingsQuery => ({
  date: `${filters.day}T12:00:00.000Z`,
  ...(filters.status === undefined ? {} : { status: filters.status }),
})
