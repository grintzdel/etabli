import { describe, expect, it } from 'vitest'

import { formatDistance, isMachineKind, parseDirectoryFilters } from './atelier'

describe('parseDirectoryFilters', () => {
  it('keeps a city and a known machine kind', () => {
    expect(parseDirectoryFilters({ city: 'Montreuil', machineKind: 'LASER_CUTTER' })).toEqual({
      city: 'Montreuil',
      machineKind: 'LASER_CUTTER',
    })
  })

  it('drops an unknown machine kind rather than passing it to the API', () => {
    expect(parseDirectoryFilters({ machineKind: 'TELEPORTEUR' })).toEqual({})
  })

  it('treats a blank city as no filter at all', () => {
    expect(parseDirectoryFilters({ city: '   ' })).toEqual({})
  })

  it('trims the city', () => {
    expect(parseDirectoryFilters({ city: '  Lyon ' })).toEqual({ city: 'Lyon' })
  })

  it('keeps the first value when a parameter is repeated', () => {
    expect(parseDirectoryFilters({ city: ['Lyon', 'Montreuil'] })).toEqual({ city: 'Lyon' })
  })
})

describe('isMachineKind', () => {
  it('accepts the six published kinds and nothing else', () => {
    expect(isMachineKind('ELECTRONICS_BENCH')).toBe(true)
    expect(isMachineKind('laser_cutter')).toBe(false)
  })
})

describe('formatDistance', () => {
  it('keeps a decimal below ten kilometres', () => {
    expect(formatDistance(7.42)).toBe('7,4 km')
  })

  it('rounds beyond ten kilometres', () => {
    expect(formatDistance(391.6)).toBe('392 km')
  })
})
