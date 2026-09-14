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
import type { UpdateMachine } from '../../../domain/atelier.schema'
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

const seedMachine = () => {
  const atelier = atelierFixture()
  const machine = machineFixture(atelier.id)
  repository.ateliers.set(atelier.id, atelier)
  repository.machines.set(machine.id, machine)
  return machine
}

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
})
