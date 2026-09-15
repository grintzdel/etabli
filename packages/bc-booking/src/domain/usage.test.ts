import { describe, expect, it } from 'vitest'

import { at } from '../__tests__/booking.test-layer'
import { CLOSING_HOUR, OPENING_HOUR } from './booking.constants'
import { openHours, overlapHours, statsWindow } from './usage'

const OPEN_PER_DAY = CLOSING_HOUR - OPENING_HOUR

// Paris is UTC+1 in March and UTC+2 from the last Sunday of March.
const NOON = at('2026-03-10T11:00:00Z')

describe('statsWindow', () => {
  it('runs from the first midnight of the span to the next one', () => {
    const window = statsWindow(NOON, 7)

    expect(window.from).toStrictEqual(at('2026-03-03T23:00:00Z'))
    expect(window.to).toStrictEqual(at('2026-03-10T23:00:00Z'))
  })

  it('counts today as the first of the days', () => {
    expect(statsWindow(NOON, 1).from).toStrictEqual(at('2026-03-09T23:00:00Z'))
  })

  it('walks over the spring forward without losing an hour of span', () => {
    expect(statsWindow(at('2026-04-01T10:00:00Z'), 7).from).toStrictEqual(at('2026-03-25T23:00:00Z'))
  })
})

describe('openHours', () => {
  it('counts one opening day per day of the span', () => {
    expect(openHours(statsWindow(NOON, 7))).toBe(7 * OPEN_PER_DAY)
  })

  it('measures the same span whatever the hour of the call', () => {
    expect(openHours(statsWindow(at('2026-03-10T06:00:00Z'), 30))).toBe(openHours(statsWindow(NOON, 30)))
  })

  it('keeps fourteen hours a day across the spring forward', () => {
    expect(openHours(statsWindow(at('2026-04-01T10:00:00Z'), 30))).toBe(30 * OPEN_PER_DAY)
  })
})

describe('overlapHours', () => {
  const window = { from: at('2026-03-10T08:00:00Z'), to: at('2026-03-10T12:00:00Z') }

  it('measures a slot held entirely inside the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T09:00:00Z'), endAt: at('2026-03-10T10:30:00Z') }, window)).toBe(1.5)
  })

  it('clips a slot that started before the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T07:00:00Z'), endAt: at('2026-03-10T09:00:00Z') }, window)).toBe(1)
  })

  it('clips a slot that runs past the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T11:00:00Z'), endAt: at('2026-03-10T13:00:00Z') }, window)).toBe(1)
  })

  it('measures nothing of a slot outside the span', () => {
    expect(overlapHours({ startAt: at('2026-03-10T13:00:00Z'), endAt: at('2026-03-10T14:00:00Z') }, window)).toBe(0)
  })
})
