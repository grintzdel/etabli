import { describe, expect, it } from 'vitest'

import { boundsOf, boundsOfRegion, FRANCE_REGION, isWithinBounds, regionFitting, visibleIn } from './map-region'

const ileDeFrance = { south: 48.7, west: 2.2, north: 49, east: 2.6 }
const paris = { latitude: 48.86, longitude: 2.35 }
const lyon = { latitude: 45.76, longitude: 4.84 }

describe('isWithinBounds', () => {
  it('keeps a point inside the box', () => {
    expect(isWithinBounds(paris, ileDeFrance)).toBe(true)
  })

  it('drops a point outside the box', () => {
    expect(isWithinBounds(lyon, ileDeFrance)).toBe(false)
  })

  it('keeps a point lying on an edge', () => {
    expect(isWithinBounds({ latitude: 48.7, longitude: 2.6 }, ileDeFrance)).toBe(true)
  })

  it('keeps every longitude once the view spans the whole world', () => {
    const world = { south: -80, west: -400, north: 80, east: 400 }
    expect(isWithinBounds({ latitude: 0, longitude: 170 }, world)).toBe(true)
  })
})

describe('visibleIn', () => {
  it('keeps everything until the map has reported its viewport', () => {
    expect(visibleIn([paris, lyon], null)).toEqual([paris, lyon])
  })

  it('keeps only what the viewport shows, in the original order', () => {
    expect(visibleIn([lyon, paris], ileDeFrance)).toEqual([paris])
  })
})

describe('boundsOf', () => {
  it('has no box for an empty directory', () => {
    expect(boundsOf([])).toBeNull()
  })

  it('wraps every point', () => {
    expect(boundsOf([paris, lyon])).toEqual({ south: 45.76, west: 2.35, north: 48.86, east: 4.84 })
  })
})

describe('boundsOfRegion', () => {
  it('turns a centre and its spans into the box the map shows', () => {
    expect(boundsOfRegion({ latitude: 48, longitude: 2, latitudeDelta: 2, longitudeDelta: 4 })).toEqual({
      south: 47,
      west: 0,
      north: 49,
      east: 4,
    })
  })
})

describe('regionFitting', () => {
  it('falls back on France for an empty directory', () => {
    expect(regionFitting([])).toEqual(FRANCE_REGION)
  })

  it('centres on the points and shows every one of them', () => {
    const region = regionFitting([paris, lyon])
    const shown = boundsOfRegion(region)

    expect(region.latitude).toBeCloseTo(47.31)
    expect(region.longitude).toBeCloseTo(3.595)
    expect(isWithinBounds(paris, shown)).toBe(true)
    expect(isWithinBounds(lyon, shown)).toBe(true)
  })

  it('zooms to a street, not to a point, for a single atelier', () => {
    const region = regionFitting([paris])

    expect(region.latitudeDelta).toBeGreaterThan(0)
    expect(region.longitudeDelta).toBeGreaterThan(0)
  })
})
