import type { AuthMembership } from '@etabli/shared/auth-context'
import { AuthContext } from '@etabli/shared/auth-context'
import { MachineId, UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, machineFixture } from '../../../__tests__/atelier.factory'
import { MachineStatus } from '../../../domain/atelier.constants'
import type { Machine, UpdateMachine } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { updateMachine } from './update-machine.command'

const USER = UserId.make('00000000-0000-4000-8000-0000000000f1')
const UNKNOWN = MachineId.make('00000000-0000-4000-8000-0000000000ef')

let repository: AtelierRepositoryMemory

const run = (machineId: MachineId, patch: UpdateMachine, memberships: ReadonlyArray<AuthMembership>) =>
  Effect.runPromiseExit(
    updateMachine(machineId, patch).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AtelierRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships }),
          ClockSystemLive
        )
      )
    )
  )

const seedMachine = (overrides: Partial<Machine> = {}) => {
  const atelier = atelierFixture()
  const machine = machineFixture(atelier.id, overrides)
  repository.ateliers.set(atelier.id, atelier)
  repository.machines.set(machine.id, machine)
  return machine
}

const fabmanagerOf = (machine: Machine): ReadonlyArray<AuthMembership> => [
  { atelierId: machine.atelierId, role: 'FABMANAGER' },
]

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
})

describe('updateMachine', () => {
  it('sends a machine to maintenance without removing it', async () => {
    const machine = seedMachine()

    const exit = await run(machine.id, { status: MachineStatus.MAINTENANCE }, [
      { atelierId: machine.atelierId, role: 'FABMANAGER' },
    ])

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(repository.machines.get(machine.id)?.status).toBe(MachineStatus.MAINTENANCE)
  })

  it('leaves the untouched fields alone', async () => {
    const machine = seedMachine()

    await run(machine.id, { status: MachineStatus.RETIRED }, [{ atelierId: machine.atelierId, role: 'FABMANAGER' }])

    expect(repository.machines.get(machine.id)?.name).toBe(machine.name)
    expect(repository.machines.get(machine.id)?.slotDurationMinutes).toBe(machine.slotDurationMinutes)
  })

  it('lifts the certification requirement when asked', async () => {
    const machine = seedMachine()

    await run(machine.id, { requiresCertification: false }, [{ atelierId: machine.atelierId, role: 'FABMANAGER' }])

    expect(repository.machines.get(machine.id)?.requiresCertification).toBe(false)
  })

  it('answers the same way to a plain member as to an unknown machine', async () => {
    const machine = seedMachine()

    const refused = await run(machine.id, { status: MachineStatus.RETIRED }, [
      { atelierId: machine.atelierId, role: 'MEMBER' },
    ])
    const unknown = await run(UNKNOWN, { status: MachineStatus.RETIRED }, [])

    expect(Exit.isFailure(refused)).toBe(true)
    expect(Exit.isFailure(unknown)).toBe(true)
    expect(repository.machines.get(machine.id)?.status).toBe(MachineStatus.AVAILABLE)
  })

  it('sticks a tag on a machine that had none', async () => {
    const machine = seedMachine()

    const exit = await run(machine.id, { nfcTagId: 'tag-trotec' }, fabmanagerOf(machine))

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(repository.machines.get(machine.id)?.nfcTagId).toBe('tag-trotec')
  })

  it('peels the tag off when the patch carries null', async () => {
    const machine = seedMachine({ nfcTagId: 'tag-trotec' })

    const exit = await run(machine.id, { nfcTagId: null }, fabmanagerOf(machine))

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(repository.machines.get(machine.id)?.nfcTagId).toBeNull()
  })

  it('leaves the tag alone when the patch does not mention it', async () => {
    const machine = seedMachine({ nfcTagId: 'tag-trotec' })

    await run(machine.id, { status: MachineStatus.MAINTENANCE }, fabmanagerOf(machine))

    expect(repository.machines.get(machine.id)?.nfcTagId).toBe('tag-trotec')
  })

  it('refuses a tag already stuck on another machine', async () => {
    const taken = seedMachine({ nfcTagId: 'tag-trotec' })
    const machine = seedMachine()

    const exit = await run(machine.id, { nfcTagId: 'tag-trotec' }, fabmanagerOf(machine))

    expect(Exit.isFailure(exit)).toBe(true)
    expect(JSON.stringify(exit)).toContain('MachineNfcTagTakenError')
    expect(repository.machines.get(machine.id)?.nfcTagId).toBeNull()
    expect(repository.machines.get(taken.id)?.nfcTagId).toBe('tag-trotec')
  })

  it('accepts the tag the machine already wears', async () => {
    const machine = seedMachine({ nfcTagId: 'tag-trotec' })

    const exit = await run(machine.id, { nfcTagId: 'tag-trotec' }, fabmanagerOf(machine))

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(repository.machines.get(machine.id)?.nfcTagId).toBe('tag-trotec')
  })
})
