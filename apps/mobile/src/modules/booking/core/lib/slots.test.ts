import { describe, expect, it } from 'vitest'

import type { AvailabilitySlot } from '../model/booking'
import { groupSlotsByDay } from './slots'

const slot = (startAt: string): AvailabilitySlot => ({
  startAt,
  endAt: startAt,
  available: true,
  reason: 'FREE',
})

describe('groupSlotsByDay', () => {
  it('cuts the week on the atelier day, not on UTC midnight', () => {
    const days = groupSlotsByDay([
      slot('2026-09-17T20:00:00.000Z'),
      slot('2026-09-17T21:00:00.000Z'),
      slot('2026-09-18T06:00:00.000Z'),
    ])

    expect(days.map((day) => day.slots.length)).toEqual([2, 1])
  })

  it('labels each day in French', () => {
    const [day] = groupSlotsByDay([slot('2026-09-17T08:00:00.000Z')])

    expect(day?.label).toBe('jeudi 17 septembre')
  })
})
