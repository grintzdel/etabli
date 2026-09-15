import { formatRange, formatTime } from '@/modules/booking/core/lib/format'
import type { SlotDay } from '@/modules/booking/core/lib/slots'
import { SLOT_REASON_LABELS } from '@/modules/booking/core/model/booking'
import { cn } from '@/ui/cn'

export type SlotGridProps = {
  readonly days: ReadonlyArray<SlotDay>
  readonly selectedStartAt: string | null
  readonly onSelect: (startAt: string) => void
}

export const SlotGrid = ({ days, selectedStartAt, onSelect }: SlotGridProps) => (
  <div className="flex flex-col gap-6">
    {days.map((day) => (
      <section key={day.key} className="flex flex-col gap-2">
        <h3 className="font-display text-graphite-400 text-xs tracking-wider uppercase">{day.label}</h3>
        <ul className="flex flex-wrap gap-2">
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
      </section>
    ))}
  </div>
)
