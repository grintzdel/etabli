import type { StatsPeriod } from '@/modules/booking/core/model/manage-stats'
import { PERIOD_LABELS, STATS_PERIODS } from '@/modules/booking/core/model/manage-stats'
import { buttonVariants } from '@/ui/Button'

export type StatsPeriodFilterProps = {
  readonly period: StatsPeriod
}

export const StatsPeriodFilter = ({ period }: StatsPeriodFilterProps) => (
  <form method="get" aria-label="Choisir la période mesurée" className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5">
      <label htmlFor="period" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        Période
      </label>
      <select
        id="period"
        name="period"
        defaultValue={period}
        className="border-graphite-700 bg-graphite-950 text-graphite-50 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none"
      >
        {STATS_PERIODS.map((value) => (
          <option key={value} value={value}>
            {PERIOD_LABELS[value]}
          </option>
        ))}
      </select>
    </div>

    <button type="submit" className={buttonVariants()}>
      Mesurer
    </button>
  </form>
)
