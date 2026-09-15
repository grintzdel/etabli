import { describe, expect, it } from 'vitest'

import { DEFAULT_STATS_PERIOD, formatHours, formatRate, parseStatsPeriod } from './manage-stats'

describe('parseStatsPeriod', () => {
  it('keeps one of the three spans', () => {
    expect(parseStatsPeriod({ period: '7d' })).toBe('7d')
  })

  it('falls back to the month on a span nobody offers', () => {
    expect(parseStatsPeriod({ period: '1y' })).toBe(DEFAULT_STATS_PERIOD)
    expect(parseStatsPeriod({})).toBe(DEFAULT_STATS_PERIOD)
  })

  it('reads the first of a repeated parameter', () => {
    expect(parseStatsPeriod({ period: ['90d', '7d'] })).toBe('90d')
  })
})

describe('formatHours', () => {
  it('drops the minutes of a round hour', () => {
    expect(formatHours(12)).toBe('12 h')
    expect(formatHours(0)).toBe('0 h')
  })

  it('pads the minutes of a part hour', () => {
    expect(formatHours(2.5)).toBe('2 h 30')
    expect(formatHours(1.1)).toBe('1 h 06')
  })
})

describe('formatRate', () => {
  it('reads a ratio as a whole percentage', () => {
    expect(formatRate(0.375)).toBe('38 %')
    expect(formatRate(0)).toBe('0 %')
  })
})
