import { beforeEach, describe, expect, it } from 'vitest'

import { detailFixture, machineFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { AtelierInMemoryAdapter } from './atelier.in-memory.adapter'

let adapter: AtelierInMemoryAdapter

beforeEach(() => {
  adapter = new AtelierInMemoryAdapter()
})

describe('AtelierInMemoryAdapter', () => {
  it('answers a seeded sheet by its slug', async () => {
    adapter.seed(detailFixture({ slug: 'la-forge', name: 'La Forge' }))

    const result = await adapter.getBySlug('la-forge')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.name).toBe('La Forge')
  })

  it('fails with NOT_FOUND on an unknown slug', async () => {
    const result = await adapter.getBySlug('inconnu')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('counts the live parc and leaves retired machines out', async () => {
    adapter.seed(
      detailFixture({
        slug: 'la-forge',
        machines: [
          machineFixture({ kind: 'LASER_CUTTER' }),
          machineFixture({ kind: 'PRINTER_3D' }),
          machineFixture({ kind: 'CNC_MILL', status: 'RETIRED' }),
        ],
      })
    )

    const result = await adapter.list({})
    if (!result.ok) throw new Error('the directory failed')
    expect(result.value[0]?.machineCount).toBe(2)
    expect(result.value[0]?.machineKinds).toEqual(['LASER_CUTTER', 'PRINTER_3D'])
  })

  it('filters on the city and on a live machine kind', async () => {
    adapter.seed(detailFixture({ slug: 'montreuil', city: 'Montreuil', machines: [machineFixture()] }))
    adapter.seed(detailFixture({ slug: 'lyon', city: 'Lyon', machines: [machineFixture({ kind: 'SEWING' })] }))

    expect((await adapter.list({ city: 'montreuil' })).ok).toBe(true)
    const byCity = await adapter.list({ city: 'montreuil' })
    if (byCity.ok) expect(byCity.value.map((summary) => summary.slug)).toEqual(['montreuil'])

    const byKind = await adapter.list({ machineKind: 'SEWING' })
    if (byKind.ok) expect(byKind.value.map((summary) => summary.slug)).toEqual(['lyon'])
  })
})
