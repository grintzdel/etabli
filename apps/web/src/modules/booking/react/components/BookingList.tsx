import Link from 'next/link'

import { formatDay, formatRange } from '@/modules/booking/core/lib/format'
import type { BookingDetail } from '@/modules/booking/core/model/booking'
import { STATUS_LABELS, STATUS_TONES } from '@/modules/booking/core/model/booking'
import { StatusBadge } from '@/ui/StatusBadge'

export type BookingListProps = {
  readonly bookings: ReadonlyArray<BookingDetail>
  readonly caption: string
}

export const BookingList = ({ bookings, caption }: BookingListProps) => (
  <table className="w-full border-collapse text-left text-sm">
    <caption className="sr-only">{caption}</caption>
    <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
      <tr className="border-graphite-800 border-b">
        <th scope="col" className="py-3 pr-4">
          Machine
        </th>
        <th scope="col" className="py-3 pr-4">
          Atelier
        </th>
        <th scope="col" className="py-3 pr-4">
          Créneau
        </th>
        <th scope="col" className="py-3">
          État
        </th>
      </tr>
    </thead>
    <tbody>
      {bookings.map((booking) => (
        <tr key={booking.id} className="border-graphite-800/60 border-b">
          <th scope="row" className="font-display py-3 pr-4 text-left font-semibold tracking-wide uppercase">
            <Link href={`/reservations/${booking.id}`} className="hover:text-signal-500">
              {booking.machineName}
            </Link>
          </th>
          <td className="text-graphite-300 py-3 pr-4">{booking.atelierName}</td>
          <td className="text-graphite-300 py-3 pr-4">
            {formatDay(booking.startAt)}
            <span className="text-graphite-100 block">{formatRange(booking.startAt, booking.endAt)}</span>
          </td>
          <td className="py-3">
            <StatusBadge tone={STATUS_TONES[booking.status]} label={STATUS_LABELS[booking.status]} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)
