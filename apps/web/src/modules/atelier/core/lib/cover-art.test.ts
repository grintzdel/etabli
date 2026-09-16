import { describe, expect, it } from 'vitest'

import { coverArtFor } from './cover-art'

describe('coverArtFor', () => {
  it('gives the same atelier the same plate every time', () => {
    expect(coverArtFor('la-forge')).toBe(coverArtFor('la-forge'))
  })

  it('stays inside the four plates that ship in public/', () => {
    const slugs = ['la-forge', 'atelier-lyon', 'le-copeau', 'bidouille-marseille', 'z', '', 'établi-é']

    for (const slug of slugs) {
      expect(coverArtFor(slug)).toMatch(/^\/ateliers\/cover-[1-4]\.png$/)
    }
  })

  it('spreads a handful of ateliers over more than one plate', () => {
    const plates = new Set(['la-forge', 'atelier-lyon', 'le-copeau', 'bidouille-marseille'].map(coverArtFor))

    expect(plates.size).toBeGreaterThan(1)
  })
})
