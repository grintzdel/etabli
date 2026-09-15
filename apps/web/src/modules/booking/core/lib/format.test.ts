import { describe, expect, it } from 'vitest'

import { formatDay, formatMoment, formatRange, formatTime } from './format'

describe('booking formatting', () => {
  it('reads an instant in the atelier’s own time zone', () => {
    expect(formatTime('2026-06-01T08:00:00.000Z')).toBe('10:00')
  })

  it('follows the summer time shift', () => {
    expect(formatTime('2026-01-15T08:00:00.000Z')).toBe('09:00')
  })

  it('names the day in French', () => {
    expect(formatDay('2026-06-01T08:00:00.000Z')).toBe('lundi 1 juin')
  })

  it('joins both ends of a slot', () => {
    expect(formatRange('2026-06-01T08:00:00.000Z', '2026-06-01T10:00:00.000Z')).toBe('10:00 – 12:00')
  })

  it('spells a single moment as a day and an hour', () => {
    expect(formatMoment('2026-06-01T08:00:00.000Z')).toBe('lundi 1 juin à 10:00')
  })
})
