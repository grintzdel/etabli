import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, defaultParams, machineFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus, MachineKind, MachineStatus } from '../../../domain/atelier.constants'
import type { ListAteliersParams } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { listAteliers } from './list-ateliers.query'

let repository: AtelierRepositoryMemory
let TestLayer: Layer.Layer<AtelierRepository>

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
  TestLayer = Layer.succeed(AtelierRepository, repository)
})

const run = (params: Partial<ListAteliersParams> = {}) =>
  Effect.runPromiseExit(
    listAteliers({ ...defaultParams, ...params } as ListAteliersParams).pipe(Effect.provide(TestLayer))
  )

const succeeds = async (params: Partial<ListAteliersParams> = {}) => {
  const exit = await run(params)
  if (Exit.isFailure(exit)) throw new Error('the directory query failed')
  return exit.value
}

describe('listAteliers', () => {
  it('only answers published ateliers', async () => {
    repository.ateliers.set('a', atelierFixture({ name: 'Publié' }))
    repository.ateliers.set('b', atelierFixture({ name: 'Brouillon', status: AtelierStatus.DRAFT }))
    repository.ateliers.set('c', atelierFixture({ name: 'Fermé', status: AtelierStatus.CLOSED }))

    expect((await succeeds()).map((summary) => summary.name)).toEqual(['Publié'])
  })

  it('filters on the city without minding the case', async () => {
    repository.ateliers.set('a', atelierFixture({ city: 'Montreuil' }))
    repository.ateliers.set('b', atelierFixture({ city: 'Lyon' }))

    expect((await succeeds({ city: 'montREUIL' })).map((summary) => summary.city)).toEqual(['Montreuil'])
  })

  it('counts the parc and lists its kinds, leaving retired machines out', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set('m1', machineFixture(atelier.id, { kind: MachineKind.LASER_CUTTER }))
    repository.machines.set('m2', machineFixture(atelier.id, { kind: MachineKind.PRINTER_3D }))
    repository.machines.set(
      'm3',
      machineFixture(atelier.id, { kind: MachineKind.CNC_MILL, status: MachineStatus.RETIRED })
    )

    const [summary] = await succeeds()
    expect(summary?.machineCount).toBe(2)
    expect(summary?.machineKinds).toEqual(['LASER_CUTTER', 'PRINTER_3D'])
  })

  it('keeps only the ateliers holding a live machine of the requested kind', async () => {
    const withLaser = atelierFixture({ name: 'Avec laser' })
    const withRetiredLaser = atelierFixture({ name: 'Laser retirée' })
    repository.ateliers.set(withLaser.id, withLaser)
    repository.ateliers.set(withRetiredLaser.id, withRetiredLaser)
    repository.machines.set('m1', machineFixture(withLaser.id, { kind: MachineKind.LASER_CUTTER }))
    repository.machines.set(
      'm2',
      machineFixture(withRetiredLaser.id, { kind: MachineKind.LASER_CUTTER, status: MachineStatus.RETIRED })
    )

    const names = (await succeeds({ machineKind: MachineKind.LASER_CUTTER })).map((summary) => summary.name)
    expect(names).toEqual(['Avec laser'])
  })

  it('measures the distance and drops what falls outside the radius', async () => {
    repository.ateliers.set('near', atelierFixture({ name: 'Montreuil', latitude: 48.8638, longitude: 2.4485 }))
    repository.ateliers.set('far', atelierFixture({ name: 'Lyon', latitude: 45.764, longitude: 4.8357 }))

    const results = await succeeds({ lat: 48.8566, lng: 2.3522, radiusKm: 20 })
    expect(results.map((summary) => summary.name)).toEqual(['Montreuil'])
    expect(results[0]?.distanceKm).toBeCloseTo(7, 0)
  })

  it('orders by distance when a position is given, by name otherwise', async () => {
    repository.ateliers.set('lyon', atelierFixture({ name: 'Lyon', latitude: 45.764, longitude: 4.8357 }))
    repository.ateliers.set('montreuil', atelierFixture({ name: 'Montreuil', latitude: 48.8638, longitude: 2.4485 }))

    expect((await succeeds()).map((summary) => summary.name)).toEqual(['Lyon', 'Montreuil'])
    expect((await succeeds({ lat: 45.75, lng: 4.85, radiusKm: 1000 })).map((summary) => summary.name)).toEqual([
      'Lyon',
      'Montreuil',
    ])
  })

  it('leaves the distance null when no position is given', async () => {
    repository.ateliers.set('a', atelierFixture())
    expect((await succeeds())[0]?.distanceKm).toBeNull()
  })

  it('paginates with limit and offset', async () => {
    repository.ateliers.set('a', atelierFixture({ name: 'A' }))
    repository.ateliers.set('b', atelierFixture({ name: 'B' }))
    repository.ateliers.set('c', atelierFixture({ name: 'C' }))

    expect((await succeeds({ limit: 2 })).map((summary) => summary.name)).toEqual(['A', 'B'])
    expect((await succeeds({ limit: 2, offset: 2 })).map((summary) => summary.name)).toEqual(['C'])
  })
})
