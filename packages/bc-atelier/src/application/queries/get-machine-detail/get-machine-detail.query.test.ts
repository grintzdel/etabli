import { MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, machineFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus, MachineStatus } from '../../../domain/atelier.constants'
import { Slug } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { getMachineDetail } from './get-machine-detail.query'

let repository: AtelierRepositoryMemory
let TestLayer: Layer.Layer<AtelierRepository>

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
  TestLayer = Layer.succeed(AtelierRepository, repository)
})

const run = (id: string) => Effect.runPromiseExit(getMachineDetail(MachineId.make(id)).pipe(Effect.provide(TestLayer)))

describe('getMachineDetail', () => {
  it('answers the machine and the atelier that holds it', async () => {
    const atelier = atelierFixture({ slug: Slug.make('la-forge'), name: 'La Forge' })
    const machine = machineFixture(atelier.id, { name: 'Trotec Speedy 400' })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set(machine.id, machine)

    const exit = await run(machine.id)
    if (Exit.isFailure(exit)) throw new Error('the machine query failed')

    expect(exit.value.name).toBe('Trotec Speedy 400')
    expect(exit.value.atelierName).toBe('La Forge')
    expect(exit.value.atelierSlug).toBe('la-forge')
  })

  it('keeps a machine under maintenance visible, with its status', async () => {
    const atelier = atelierFixture()
    const machine = machineFixture(atelier.id, { status: MachineStatus.MAINTENANCE })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set(machine.id, machine)

    const exit = await run(machine.id)
    if (Exit.isFailure(exit)) throw new Error('the machine query failed')
    expect(exit.value.status).toBe('MAINTENANCE')
  })

  it('never leaks the NFC tag', async () => {
    const atelier = atelierFixture()
    const machine = machineFixture(atelier.id, { nfcTagId: 'nfc-forge-laser-01' })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set(machine.id, machine)

    const exit = await run(machine.id)
    if (Exit.isFailure(exit)) throw new Error('the machine query failed')
    expect(exit.value).not.toHaveProperty('nfcTagId')
  })

  it('hides a retired machine behind MachineUnknownError', async () => {
    const atelier = atelierFixture()
    const machine = machineFixture(atelier.id, { status: MachineStatus.RETIRED })
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set(machine.id, machine)

    expect(Exit.isFailure(await run(machine.id))).toBe(true)
  })

  it('hides a machine whose atelier is not published', async () => {
    const atelier = atelierFixture({ status: AtelierStatus.DRAFT })
    const machine = machineFixture(atelier.id)
    repository.ateliers.set(atelier.id, atelier)
    repository.machines.set(machine.id, machine)

    expect(Exit.isFailure(await run(machine.id))).toBe(true)
  })

  it('fails the same way on a machine that never existed', async () => {
    expect(Exit.isFailure(await run(globalThis.crypto.randomUUID()))).toBe(true)
  })
})
