import { queryString } from '@etabli/api-client'
import { describe, expect, it } from 'vitest'

import { directoryQuery } from './directory-query'

const PARIS = { latitude: 48.8566, longitude: 2.3522 }

describe('directoryQuery', () => {
  it('asks for nothing when there is neither position nor filter', () => {
    expect(queryString(directoryQuery(null, {}))).toBe('')
  })

  it('sends lat, lng and radiusKm together', () => {
    expect(queryString(directoryQuery(PARIS, {}))).toBe('?lat=48.8566&lng=2.3522&radiusKm=1000')
  })

  it('never sends a part of the trio, since the api refuses a lat without a radiusKm', () => {
    expect(queryString(directoryQuery(null, { city: 'Montreuil' }))).not.toContain('lat')
  })

  it('sends the filters the screen holds', () => {
    expect(queryString(directoryQuery(null, { city: 'Montreuil', machineKind: 'LASER_CUTTER' }))).toBe(
      '?city=Montreuil&machineKind=LASER_CUTTER'
    )
  })

  it('carries filters and position at once — the api composes them', () => {
    const query = queryString(directoryQuery(PARIS, { machineKind: 'SEWING' }))

    expect(query).toContain('machineKind=SEWING')
    expect(query).toContain('radiusKm=1000')
  })
})
