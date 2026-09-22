import { describe, expect, it } from 'vitest'

import { queryString } from './query'

describe('queryString', () => {
  it('returns nothing when there is no query at all', () => {
    expect(queryString(undefined)).toBe('')
  })

  it('serializes numbers and booleans without the caller stringifying them', () => {
    expect(queryString({ lat: 48.8566, lng: 2.3522, radiusKm: 1000, open: true })).toBe(
      '?lat=48.8566&lng=2.3522&radiusKm=1000&open=true'
    )
  })

  it('serializes the falsy values that are still values', () => {
    expect(queryString({ page: 0, archived: false })).toBe('?page=0&archived=false')
  })

  it('drops undefined and null entries', () => {
    expect(queryString({ city: 'Paris', machineKind: undefined, status: null })).toBe('?city=Paris')
  })

  it('repeats an array under the same key', () => {
    expect(queryString({ status: ['BOOKED', 'CHECKED_IN'] })).toBe('?status=BOOKED&status=CHECKED_IN')
  })

  it('drops the empty entries of an array', () => {
    expect(queryString({ status: ['BOOKED', undefined, null] })).toBe('?status=BOOKED')
  })

  it('appends nothing when every entry is empty', () => {
    expect(queryString({ city: undefined, status: [] })).toBe('')
  })

  it('percent-encodes keys and values', () => {
    expect(queryString({ search: 'Jean Dupont & fils' })).toBe('?search=Jean+Dupont+%26+fils')
  })
})
