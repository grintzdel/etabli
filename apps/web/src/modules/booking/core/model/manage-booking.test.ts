import { describe, expect, it } from 'vitest'

import { parseBookingDeskFilters, toAtelierBookingsQuery } from './manage-booking'

const JUNE_FIRST = new Date('2026-06-01T21:30:00.000Z')

describe('parseBookingDeskFilters', () => {
  it('falls back on the atelier’s today, not the browser’s', () => {
    expect(parseBookingDeskFilters({}, new Date('2026-06-01T22:30:00.000Z')).day).toBe('2026-06-02')
  })

  it('keeps a day written as the date input writes it', () => {
    expect(parseBookingDeskFilters({ day: '2026-03-29' }, JUNE_FIRST).day).toBe('2026-03-29')
  })

  it('ignores a day that is not one', () => {
    expect(parseBookingDeskFilters({ day: 'demain' }, JUNE_FIRST).day).toBe('2026-06-01')
  })

  it('keeps a status the domain knows and drops the rest', () => {
    expect(parseBookingDeskFilters({ status: 'CHECKED_IN' }, JUNE_FIRST).status).toBe('CHECKED_IN')
    expect(parseBookingDeskFilters({ status: 'PARTI' }, JUNE_FIRST).status).toBeUndefined()
  })
})

describe('toAtelierBookingsQuery', () => {
  it('sends noon so the day stays the same whatever the offset', () => {
    expect(toAtelierBookingsQuery({ day: '2026-03-29' })).toStrictEqual({ date: '2026-03-29T12:00:00.000Z' })
  })

  it('carries the status only when one was chosen', () => {
    expect(toAtelierBookingsQuery({ day: '2026-03-29', status: 'NO_SHOW' }).status).toBe('NO_SHOW')
  })
})
