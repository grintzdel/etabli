export const BookingStatus = {
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export const BOOKING_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW,
] as const

export const ACTIVE_BOOKING_STATUSES = [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] as const

export const CheckInMethod = {
  NFC: 'NFC',
  MANUAL: 'MANUAL',
} as const
export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod]

export const CHECK_IN_METHODS = [CheckInMethod.NFC, CheckInMethod.MANUAL] as const

export const SlotReason = {
  FREE: 'FREE',
  BOOKED: 'BOOKED',
  PAST: 'PAST',
  MACHINE_UNAVAILABLE: 'MACHINE_UNAVAILABLE',
} as const
export type SlotReason = (typeof SlotReason)[keyof typeof SlotReason]

export const SLOT_REASONS = [
  SlotReason.FREE,
  SlotReason.BOOKED,
  SlotReason.PAST,
  SlotReason.MACHINE_UNAVAILABLE,
] as const

export const CHECK_IN_OPENS_MINUTES_BEFORE = 15
export const CHECK_IN_CLOSES_MINUTES_AFTER = 30

export const ATELIER_TIME_ZONE = 'Europe/Paris'
export const OPENING_HOUR = 8
export const CLOSING_HOUR = 22
export const AVAILABILITY_DAYS = 7

export const StatsPeriod = {
  WEEK: '7d',
  MONTH: '30d',
  QUARTER: '90d',
} as const
export type StatsPeriod = (typeof StatsPeriod)[keyof typeof StatsPeriod]

export const STATS_PERIODS = [StatsPeriod.WEEK, StatsPeriod.MONTH, StatsPeriod.QUARTER] as const

export const STATS_PERIOD_DAYS: Readonly<Record<StatsPeriod, number>> = {
  [StatsPeriod.WEEK]: 7,
  [StatsPeriod.MONTH]: 30,
  [StatsPeriod.QUARTER]: 90,
}

export const DEFAULT_STATS_PERIOD: StatsPeriod = StatsPeriod.MONTH

export const UNKNOWN_MEMBER = 'Compte supprimé'
