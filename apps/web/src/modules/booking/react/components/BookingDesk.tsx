import { StatusBadge } from '@etabli/ui'

import { formatRange } from '@/modules/booking/core/lib/format'
import type { BookingActionState } from '@/modules/booking/core/model/booking'
import { STATUS_LABELS, STATUS_TONES } from '@/modules/booking/core/model/booking'
import type { AtelierBooking } from '@/modules/booking/core/model/manage-booking'
import { CHECK_IN_METHOD_LABELS } from '@/modules/booking/core/model/manage-booking'

import { BookingRowAction } from './BookingRowAction'

type BookingAction = (state: BookingActionState, formData: FormData) => Promise<BookingActionState>

export type BookingDeskProps = {
  readonly bookings: ReadonlyArray<AtelierBooking>
  readonly checkIn: BookingAction
  readonly markNoShow: BookingAction
  readonly cancel: BookingAction
}

export const BookingDesk = ({ bookings, checkIn, markNoShow, cancel }: BookingDeskProps) => {
  if (bookings.length === 0) {
    return <p className="text-graphite-300">Aucune réservation ce jour-là.</p>
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Réservations de la journée</caption>
      <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        <tr className="border-graphite-800 border-b">
          <th scope="col" className="py-3 pr-4">
            Créneau
          </th>
          <th scope="col" className="py-3 pr-4">
            Machine
          </th>
          <th scope="col" className="py-3 pr-4">
            Membre
          </th>
          <th scope="col" className="py-3 pr-4">
            État
          </th>
          <th scope="col" className="py-3">
            Pointage
          </th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id} id={booking.id} className="border-graphite-800/60 border-b">
            <th scope="row" className="font-display py-3 pr-4 text-left font-semibold tracking-wide">
              {formatRange(booking.startAt, booking.endAt)}
            </th>
            <td className="text-graphite-300 py-3 pr-4">{booking.machineName}</td>
            <td className="text-graphite-100 py-3 pr-4">{booking.memberName}</td>
            <td className="py-3 pr-4">
              <StatusBadge tone={STATUS_TONES[booking.status]} label={STATUS_LABELS[booking.status]} />
            </td>
            <td className="flex flex-col gap-2 py-3">
              {booking.canCancel ? (
                <BookingRowAction
                  bookingId={booking.id}
                  label="Annuler"
                  pendingLabel="Annulation…"
                  variant="danger"
                  action={cancel}
                />
              ) : null}
              {booking.checkedInVia !== null ? (
                <span className="text-graphite-300">{CHECK_IN_METHOD_LABELS[booking.checkedInVia]}</span>
              ) : booking.canCheckIn ? (
                <BookingRowAction bookingId={booking.id} label="Pointer" pendingLabel="Pointage…" action={checkIn} />
              ) : booking.canMarkNoShow ? (
                <BookingRowAction
                  bookingId={booking.id}
                  label="Marquer non honorée"
                  pendingLabel="Marquage…"
                  variant="danger"
                  action={markNoShow}
                />
              ) : (
                <span className="text-graphite-500">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
