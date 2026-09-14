import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, machineFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus, MachineKind, MachineStatus } from '../../../domain/atelier.constants'
import { Slug } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { getAtelierBySlug } from './get-atelier-by-slug.query'

let repository: AtelierRepositoryMemory
let TestLayer: Layer.Layer<AtelierRepository>

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
  TestLayer = Layer.succeed(AtelierRepository, repository)
})

const run = (slug: string) => Effect.runPromiseExit(getAtelierBySlug(Slug.make(slug)).pipe(Effect.provide(TestLayer)))

describe('getAtelierBySlug', () => {
  it('answers the atelier and its parc', async () => {
    const atelier = atelierFixture({ slug: Slug.make('la-forge') })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set('m1', machineFixture(atelier.id, { name: 'Trotec', kind: MachineKind.LASER_CUTTER }))

    const exit = await run('la-forge')
    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return

    expect(exit.value.slug).toBe('la-forge')
    expect(exit.value.machines.map((machine) => machine.name)).toEqual(['Trotec'])
  })

  it('hides retired machines from the public sheet', async () => {
    const atelier = atelierFixture({ slug: Slug.make('la-forge') })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set('m1', machineFixture(atelier.id, { name: 'Vivante' }))
    repository.machines.set('m2', machineFixture(atelier.id, { name: 'Retirée', status: MachineStatus.RETIRED }))

    const exit = await run('la-forge')
    if (Exit.isFailure(exit)) throw new Error('the sheet query failed')
    expect(exit.value.machines.map((machine) => machine.name)).toEqual(['Vivante'])
  })

  it('keeps machines under maintenance visible, with their status', async () => {
    const atelier = atelierFixture({ slug: Slug.make('la-forge') })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set('m1', machineFixture(atelier.id, { status: MachineStatus.MAINTENANCE }))

    const exit = await run('la-forge')
    if (Exit.isFailure(exit)) throw new Error('the sheet query failed')
    expect(exit.value.machines[0]?.status).toBe('MAINTENANCE')
  })

  it('fails with AtelierNotFoundError on an unknown slug', async () => {
    const exit = await run('inconnu')
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it('fails the same way on a draft atelier', async () => {
    const atelier = atelierFixture({ slug: Slug.make('brouillon'), status: AtelierStatus.DRAFT })
    repository.ateliers.set(atelier.id, atelier)

    expect(Exit.isFailure(await run('brouillon'))).toBe(true)
  })
})
