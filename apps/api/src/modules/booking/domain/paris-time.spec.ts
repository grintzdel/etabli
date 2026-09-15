import { describe, expect, it } from 'vitest'

import { fromLocal, localHourOfDay, localMidnight } from './paris-time.ts'

const iso = (date: Date): string => date.toISOString()

describe('localMidnight', () => {
  it('lands on the Paris midnight of the day, in winter time', () => {
    expect(iso(localMidnight(new Date('2026-03-02T15:20:00Z')))).toBe('2026-03-01T23:00:00.000Z')
  })

  it('walks whole calendar days, summer time included', () => {
    expect(iso(localMidnight(new Date('2026-03-02T15:20:00Z'), 7))).toBe('2026-03-08T23:00:00.000Z')
    expect(iso(localMidnight(new Date('2026-04-01T10:00:00Z'), -6))).toBe('2026-03-25T23:00:00.000Z')
  })

  it('rolls over the end of a month', () => {
    expect(iso(localMidnight(new Date('2026-01-31T12:00:00Z'), 1))).toBe('2026-01-31T23:00:00.000Z')
  })
})

describe('localHourOfDay', () => {
  it('keeps the wall-clock hour across the spring forward', () => {
    const friday = new Date('2026-03-27T00:00:00Z')

    expect(iso(localHourOfDay(friday, 1, 8))).toBe('2026-03-28T07:00:00.000Z')
    expect(iso(localHourOfDay(friday, 2, 8))).toBe('2026-03-29T06:00:00.000Z')
  })
})

describe('fromLocal', () => {
  it('reads a winter wall clock as UTC+1 and a summer one as UTC+2', () => {
    expect(iso(fromLocal(2026, 1, 15, 12))).toBe('2026-01-15T11:00:00.000Z')
    expect(iso(fromLocal(2026, 7, 15, 12))).toBe('2026-07-15T10:00:00.000Z')
  })
})
