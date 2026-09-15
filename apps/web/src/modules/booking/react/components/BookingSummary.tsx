import Link from 'next/link'

import { formatDay, formatMoment, formatRange } from '@/modules/booking/core/lib/format'
import type { BookingActionState, BookingDetail } from '@/modules/booking/core/model/booking'
import { STATUS_LABELS, STATUS_TONES } from '@/modules/booking/core/model/booking'
import { StatusBadge } from '@/ui/StatusBadge'

import { CancelBookingForm } from './CancelBookingForm'

export type BookingSummaryProps = {
  readonly booking: BookingDetail
  readonly cancel: (state: BookingActionState, formData: FormData) => Promise<BookingActionState>
}

const termClassName = 'font-display text-graphite-400 text-xs tracking-wider uppercase'

export const BookingSummary = ({ booking, cancel }: BookingSummaryProps) => (
  <div className="flex flex-col gap-8">
    <dl className="grid gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <dt className={termClassName}>Atelier</dt>
        <dd>
          <Link href={`/ateliers/${booking.atelierSlug}`} className="text-graphite-100 hover:text-signal-500">
            {booking.atelierName}
          </Link>
        </dd>
      </div>

      <div className="flex flex-col gap-1">
        <dt className={termClassName}>État</dt>
        <dd>
          <StatusBadge tone={STATUS_TONES[booking.status]} label={STATUS_LABELS[booking.status]} />
        </dd>
      </div>

      <div className="flex flex-col gap-1">
        <dt className={termClassName}>Créneau</dt>
        <dd className="text-graphite-100">
          {formatDay(booking.startAt)}
          <span className="block">{formatRange(booking.startAt, booking.endAt)}</span>
        </dd>
      </div>

      {booking.checkedInAt === null ? null : (
        <div className="flex flex-col gap-1">
          <dt className={termClassName}>Pointage</dt>
          <dd className="text-graphite-100">{formatMoment(booking.checkedInAt)}</dd>
        </div>
      )}

      {booking.cancelledAt === null ? null : (
        <div className="flex flex-col gap-1">
          <dt className={termClassName}>Annulée le</dt>
          <dd className="text-graphite-100">{formatMoment(booking.cancelledAt)}</dd>
        </div>
      )}
    </dl>

    {booking.canCheckIn ? (
      <p className="text-graphite-300 text-sm">
        Le pointage est ouvert : approchez votre téléphone du tag posé sur la machine.
      </p>
    ) : null}

    {booking.canCancel ? (
      <CancelBookingForm bookingId={booking.id} action={cancel} />
    ) : (
      <p className="text-graphite-400 text-sm">
        {booking.status === 'CONFIRMED'
          ? 'Un créneau commencé ne s’annule plus.'
          : 'Cette réservation est close : elle ne peut plus être annulée.'}
      </p>
    )}
  </div>
)
