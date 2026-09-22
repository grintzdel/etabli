import { describe, expect, it } from 'vitest'

import type { MachineKind } from '../model/atelier'
import { COVER_KEYS, photoKeyFor } from './atelier-photo'

const KINDS: ReadonlyArray<MachineKind> = ['LASER_CUTTER', 'PRINTER_3D', 'CNC_MILL']

describe('photoKeyFor', () => {
  it('picks a kind the atelier publishes', () => {
    expect(KINDS).toContain(photoKeyFor('atelier-de-montreuil', KINDS))
  })

  it('gives the same slug the same photo twice', () => {
    expect(photoKeyFor('la-fabrique', KINDS)).toBe(photoKeyFor('la-fabrique', KINDS))
  })

  it('spreads the parc over several slugs instead of always taking the first kind', () => {
    const slugs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const picked = new Set(slugs.map((slug) => photoKeyFor(slug, KINDS)))

    expect(picked.size).toBeGreaterThan(1)
  })

  it('falls back on a drawn plate when the atelier publishes no machine', () => {
    expect(COVER_KEYS).toContain(photoKeyFor('atelier-sans-machine', []))
  })

  it('gives the same slug the same plate twice', () => {
    expect(photoKeyFor('atelier-sans-machine', [])).toBe(photoKeyFor('atelier-sans-machine', []))
  })
})
