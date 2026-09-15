import { describe, expect, it } from 'vitest'

import type { AvailabilitySlot } from '../model/booking'
import { dayKey, groupSlotsByDay } from './slots'

const slot = (startAt: string, endAt: string): AvailabilitySlot => ({
  startAt,
  endAt,
  available: true,
  reason: 'FREE',
})

describe('dayKey', () => {
  it('reads the day in the atelier’s time zone, not in UTC', () => {
    expect(dayKey('2026-06-01T22:30:00.000Z')).toBe(dayKey('2026-06-02T00:30:00.000Z'))
  })
})

describe('groupSlotsByDay', () => {
  it('gathers the slots of one day under their day', () => {
    const days = groupSlotsByDay([
      slot('2026-06-01T06:00:00.000Z', '2026-06-01T07:00:00.000Z'),
      slot('2026-06-01T07:00:00.000Z', '2026-06-01T08:00:00.000Z'),
      slot('2026-06-02T06:00:00.000Z', '2026-06-02T07:00:00.000Z'),
    ])

    expect(days).toHaveLength(2)
    expect(days[0]?.label).toBe('lundi 1 juin')
    expect(days[0]?.slots).toHaveLength(2)
    expect(days[1]?.label).toBe('mardi 2 juin')
  })

  it('keeps a late slot on the local day it belongs to', () => {
    const days = groupSlotsByDay([
      slot('2026-06-01T18:00:00.000Z', '2026-06-01T19:00:00.000Z'),
      slot('2026-06-01T19:00:00.000Z', '2026-06-01T20:00:00.000Z'),
    ])

    expect(days).toHaveLength(1)
    expect(days[0]?.label).toBe('lundi 1 juin')
  })

  it('gives nothing back for no slot', () => {
    expect(groupSlotsByDay([])).toEqual([])
  })
})
