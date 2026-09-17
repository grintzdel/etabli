import { buttonVariants } from '@etabli/ui/web'

import { STATUS_LABELS } from '@/modules/booking/core/model/booking'
import type { BookingDeskFilters as Filters } from '@/modules/booking/core/model/manage-booking'
import { BOOKING_STATUSES } from '@/modules/booking/core/model/manage-booking'

export type BookingDeskFiltersProps = {
  readonly filters: Filters
}

const fieldClassName =
  'border-graphite-700 bg-graphite-950 text-graphite-50 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none'

export const BookingDeskFilters = ({ filters }: BookingDeskFiltersProps) => (
  <form method="get" aria-label="Filtrer les réservations" className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5">
      <label htmlFor="day" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        Jour
      </label>
      <input id="day" name="day" type="date" defaultValue={filters.day} className={fieldClassName} />
    </div>

    <div className="flex flex-col gap-1.5">
      <label htmlFor="status" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        État
      </label>
      <select id="status" name="status" defaultValue={filters.status ?? ''} className={fieldClassName}>
        <option value="">Tous</option>
        {BOOKING_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>

    <button type="submit" className={buttonVariants()}>
      Filtrer
    </button>
  </form>
)
