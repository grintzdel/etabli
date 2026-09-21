import type {
  AvailabilitySlot,
  BookingDetail,
  BookingStatus,
  CreateBooking,
  MachineAvailability,
  SlotReason,
} from '@etabli/contract'
import { makeFailure, type Failure, type Result } from '@etabli/shared/http'

export type { AvailabilitySlot, BookingDetail, BookingStatus, CreateBooking, MachineAvailability, SlotReason }

export const BookingFailureCode = {
  MACHINE_NOT_BOOKABLE: 'MACHINE_NOT_BOOKABLE',
  MACHINE_UNAVAILABLE: 'MACHINE_UNAVAILABLE',
  MISSING_CERTIFICATION: 'MISSING_CERTIFICATION',
  SLOT_IN_THE_PAST: 'SLOT_IN_THE_PAST',
  SLOT_TAKEN: 'SLOT_TAKEN',
  BOOKING_UNKNOWN: 'BOOKING_UNKNOWN',
  NOT_CANCELLABLE: 'NOT_CANCELLABLE',
  NOT_CHECK_INABLE: 'NOT_CHECK_INABLE',
  CHECK_IN_WINDOW_CLOSED: 'CHECK_IN_WINDOW_CLOSED',
  NOT_MARKABLE_AS_NO_SHOW: 'NOT_MARKABLE_AS_NO_SHOW',
  NFC_TAG_MISMATCH: 'NFC_TAG_MISMATCH',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type BookingFailureCode = (typeof BookingFailureCode)[keyof typeof BookingFailureCode]

export type BookingFailure = Failure<BookingFailureCode>

export type BookingResult<A> = Result<A, BookingFailureCode>

export const FAILURE_MESSAGES: Readonly<Record<BookingFailureCode, string>> = {
  MACHINE_NOT_BOOKABLE: 'Cette machine n’existe pas, ou ne fait pas partie de vos ateliers.',
  MACHINE_UNAVAILABLE: 'Cette machine est en maintenance : elle ne prend pas de réservation.',
  MISSING_CERTIFICATION: 'Vous n’êtes pas habilité sur cette machine.',
  SLOT_IN_THE_PAST: 'Ce créneau est déjà passé.',
  SLOT_TAKEN: 'Ce créneau vient d’être pris.',
  BOOKING_UNKNOWN: 'Cette réservation n’existe pas.',
  NOT_CANCELLABLE: 'Cette réservation ne peut plus être annulée.',
  NOT_CHECK_INABLE: 'Cette réservation ne peut pas être pointée.',
  CHECK_IN_WINDOW_CLOSED: 'Le pointage ouvre 15 minutes avant le créneau et ferme 30 minutes après son début.',
  NOT_MARKABLE_AS_NO_SHOW:
    'Ce créneau ne peut pas être marqué non honoré : il est pointé, clos, ou sa fenêtre de pointage court encore.',
  NFC_TAG_MISMATCH: 'Ce tag n’est pas celui de la machine réservée.',
  FORBIDDEN: 'Cette page est réservée aux administrateurs de la plateforme.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Les réservations sont momentanément indisponibles.',
}

export const failure = makeFailure(FAILURE_MESSAGES)

export const STATUS_LABELS: Readonly<Record<BookingStatus, string>> = {
  CONFIRMED: 'Confirmée',
  CHECKED_IN: 'Pointée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  NO_SHOW: 'Non honorée',
}

export const STATUS_TONES: Readonly<Record<BookingStatus, 'ok' | 'warn' | 'danger' | 'neutral'>> = {
  CONFIRMED: 'ok',
  CHECKED_IN: 'ok',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
  NO_SHOW: 'danger',
}

export const SLOT_REASON_LABELS: Readonly<Record<SlotReason, string>> = {
  FREE: 'Libre',
  BOOKED: 'Déjà réservé',
  PAST: 'Passé',
  MACHINE_UNAVAILABLE: 'Machine indisponible',
}

const OPEN_STATUSES: ReadonlySet<BookingStatus> = new Set(['CONFIRMED', 'CHECKED_IN'])

export const isUpcoming = (booking: BookingDetail, now: Date): boolean =>
  OPEN_STATUSES.has(booking.status) && new Date(booking.endAt).getTime() > now.getTime()

export interface BookingPartition {
  readonly upcoming: ReadonlyArray<BookingDetail>
  readonly past: ReadonlyArray<BookingDetail>
}

const byStartAt = (direction: 1 | -1) => (left: BookingDetail, right: BookingDetail) =>
  direction * (new Date(left.startAt).getTime() - new Date(right.startAt).getTime())

export const partitionBookings = (bookings: ReadonlyArray<BookingDetail>, now: Date): BookingPartition => ({
  upcoming: bookings.filter((booking) => isUpcoming(booking, now)).toSorted(byStartAt(1)),
  past: bookings.filter((booking) => !isUpcoming(booking, now)).toSorted(byStartAt(-1)),
})

export interface BookingActionState {
  readonly error: string | null
}
