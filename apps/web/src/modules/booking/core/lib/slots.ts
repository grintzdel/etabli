import type { AvailabilitySlot } from '../model/booking'
import { ATELIER_TIME_ZONE, formatDay } from './format'

const dayStamp = new Intl.DateTimeFormat('fr-FR', {
  timeZone: ATELIER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const dayKey = (iso: string): string => dayStamp.format(new Date(iso))

export interface SlotDay {
  readonly key: string
  readonly label: string
  readonly slots: ReadonlyArray<AvailabilitySlot>
}

export const groupSlotsByDay = (slots: ReadonlyArray<AvailabilitySlot>): ReadonlyArray<SlotDay> => {
  const days: Array<{ key: string; label: string; slots: Array<AvailabilitySlot> }> = []

  for (const slot of slots) {
    const key = dayKey(slot.startAt)
    const current = days.at(-1)
    if (current?.key === key) current.slots.push(slot)
    else days.push({ key, label: formatDay(slot.startAt), slots: [slot] })
  }

  return days
}
