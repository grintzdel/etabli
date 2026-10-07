import type { AvailabilitySlot } from '../model/booking'
import { ATELIER_TIME_ZONE, formatDay } from './format'

const dayStamp = new Intl.DateTimeFormat('fr-FR', {
  timeZone: ATELIER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const part = (options: Intl.DateTimeFormatOptions) => {
  const format = new Intl.DateTimeFormat('fr-FR', { timeZone: ATELIER_TIME_ZONE, ...options })
  return (iso: string): string => format.format(new Date(iso)).replace(/\.$/, '')
}

const weekdayOf = part({ weekday: 'short' })
const dateOf = part({ day: 'numeric' })
const monthOf = part({ month: 'short' })

export const dayKey = (iso: string): string => dayStamp.format(new Date(iso))

export interface SlotDay {
  readonly key: string
  readonly label: string
  readonly weekday: string
  readonly date: string
  readonly month: string
  readonly freeCount: number
  readonly slots: ReadonlyArray<AvailabilitySlot>
}

export const groupSlotsByDay = (slots: ReadonlyArray<AvailabilitySlot>): ReadonlyArray<SlotDay> => {
  const days: Array<{ key: string; startAt: string; slots: Array<AvailabilitySlot> }> = []

  for (const slot of slots) {
    const key = dayKey(slot.startAt)
    const current = days.at(-1)
    if (current?.key === key) current.slots.push(slot)
    else days.push({ key, startAt: slot.startAt, slots: [slot] })
  }

  return days.map(({ key, startAt, slots: daySlots }) => ({
    key,
    label: formatDay(startAt),
    weekday: weekdayOf(startAt),
    date: dateOf(startAt),
    month: monthOf(startAt),
    freeCount: daySlots.filter((slot) => slot.available).length,
    slots: daySlots,
  }))
}
