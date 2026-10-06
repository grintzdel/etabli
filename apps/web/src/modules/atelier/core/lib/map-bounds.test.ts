import { describe, expect, it } from 'vitest'

import { boundsOf, isWithinBounds, visibleIn } from './map-bounds'

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
