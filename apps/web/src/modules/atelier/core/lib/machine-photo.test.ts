import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { MACHINE_KINDS } from '../model/atelier'
import { atelierPhotoFor, machinePhotoFor } from './machine-photo'

const onDisk = (publicPath: string): boolean =>
  existsSync(resolve(import.meta.dirname, '../../../../../public', publicPath.slice(1)))

describe('machinePhotoFor', () => {
  it('ships a photo for every machine kind', () => {
    for (const kind of MACHINE_KINDS) {
      expect(onDisk(machinePhotoFor(kind))).toBe(true)
    }
  })

  it('gives each kind its own photo', () => {
    expect(new Set(MACHINE_KINDS.map(machinePhotoFor)).size).toBe(MACHINE_KINDS.length)
  })
})

describe('atelierPhotoFor', () => {
  it('has nothing to show for an atelier without a published machine', () => {
    expect(atelierPhotoFor('la-forge', [])).toBeNull()
  })

  it('only ever shows a kind the atelier actually has', () => {
    const kinds = ['SEWING', 'WOOD_LATHE'] as const
    const allowed = kinds.map(machinePhotoFor)

    for (const slug of ['la-forge', 'atelier-lyon', 'le-copeau', 'z', '', 'établi-é']) {
      expect(allowed).toContain(atelierPhotoFor(slug, kinds))
    }
  })

  it('gives the same atelier the same photo every time', () => {
    const kinds = ['LASER_CUTTER', 'PRINTER_3D', 'CNC_MILL'] as const

    expect(atelierPhotoFor('la-forge', kinds)).toBe(atelierPhotoFor('la-forge', kinds))
  })

  it('spreads a handful of ateliers over more than one photo', () => {
    const kinds = ['LASER_CUTTER', 'PRINTER_3D', 'CNC_MILL'] as const
    const slugs = ['la-forge', 'atelier-lyon', 'le-copeau', 'bidouille-marseille']

    expect(new Set(slugs.map((slug) => atelierPhotoFor(slug, kinds))).size).toBeGreaterThan(1)
  })
})
