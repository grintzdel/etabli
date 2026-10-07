import { cn } from '@etabli/ui/web'

import { formatRange, formatTime } from '@/modules/booking/core/lib/format'
import type { SlotDay } from '@/modules/booking/core/lib/slots'
import { SLOT_REASON_LABELS } from '@/modules/booking/core/model/booking'

export type SlotGridProps = {
  readonly days: ReadonlyArray<SlotDay>
  readonly selectedStartAt: string | null
  readonly onSelect: (startAt: string) => void
}

const freeLabelOf = (count: number): string =>
  count === 0 ? 'Complet' : count === 1 ? '1 créneau libre' : `${count} créneaux libres`

export const SlotGrid = ({ days, selectedStartAt, onSelect }: SlotGridProps) => (
  <div className="flex flex-col gap-3">
    {days.map((day, index) => (
      <details key={day.key} open={index === 0} className="group border-graphite-800 bg-graphite-900 rounded-sm border">
        <summary className="hover:bg-graphite-800/50 flex cursor-pointer list-none items-center gap-4 p-3 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden="true"
            className="border-graphite-700 bg-graphite-950 flex w-14 shrink-0 flex-col items-center rounded-sm border py-1"
          >
            <span className="font-display text-signal-500 text-[0.65rem] tracking-wider uppercase">{day.weekday}</span>
            <span className="font-display text-graphite-50 text-xl leading-tight">{day.date}</span>
            <span className="font-display text-graphite-400 text-[0.65rem] tracking-wider uppercase">{day.month}</span>
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <h3 className="font-display text-graphite-100 text-sm tracking-wide first-letter:uppercase">{day.label}</h3>
            <span className="text-graphite-400 text-xs">{freeLabelOf(day.freeCount)}</span>
          </span>
          <span aria-hidden="true" className="text-graphite-400 transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <ul className="border-graphite-800 flex flex-wrap gap-2 border-t p-3">
          {day.slots.map((slot) => (
            <li key={slot.startAt}>
              <button
                type="button"
                disabled={!slot.available}
                aria-pressed={slot.startAt === selectedStartAt}
                aria-label={`${formatRange(slot.startAt, slot.endAt)} — ${SLOT_REASON_LABELS[slot.reason]}`}
                onClick={() => onSelect(slot.startAt)}
                className={cn(
                  'font-display rounded-sm border px-3 py-1.5 text-sm tracking-wide transition-colors',
                  slot.available
                    ? 'border-graphite-700 text-graphite-100 hover:border-signal-500 hover:text-signal-500'
                    : 'border-graphite-800 text-graphite-600 cursor-not-allowed line-through',
                  slot.startAt === selectedStartAt && 'border-signal-500 bg-signal-500 text-graphite-950'
                )}
              >
                {formatTime(slot.startAt)}
              </button>
            </li>
          ))}
        </ul>
      </details>
    ))}
  </div>
)
