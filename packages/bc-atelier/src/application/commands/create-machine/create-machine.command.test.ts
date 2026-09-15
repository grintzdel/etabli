import type { AuthMembership } from '@etabli/shared/auth-context'
import { AuthContext } from '@etabli/shared/auth-context'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import { AtelierId, UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, machineFixture } from '../../../__tests__/atelier.factory'
import { MachineKind, MachineStatus } from '../../../domain/atelier.constants'
import type { CreateMachine } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { createMachine } from './create-machine.command'

const USER = UserId.make('00000000-0000-4000-8000-0000000000f1')
const OTHER = AtelierId.make('00000000-0000-4000-8000-0000000000ee')

let repository: AtelierRepositoryMemory

const input = (atelierId: CreateMachine['atelierId'], overrides: Partial<CreateMachine> = {}): CreateMachine => ({
  atelierId,
  name: 'Trotec Speedy',
  description: 'Découpe laser 100 W',
  kind: MachineKind.LASER_CUTTER,
  requiresCertification: true,
  slotDurationMinutes: 60,
  nfcTagId: null,
  ...overrides,
})

const run = (payload: CreateMachine, memberships: ReadonlyArray<AuthMembership>) =>
  Effect.runPromiseExit(
    createMachine(payload).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AtelierRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships }),
          IdGeneratorCryptoLive,
          ClockSystemLive
        )
      )
    )
  )

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
})

describe('createMachine', () => {
  it('puts the machine on the floor, available', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)

    const exit = await run(input(atelier.id), [{ atelierId: atelier.id, role: 'FABMANAGER' }])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(MachineStatus.AVAILABLE)
    expect(exit.value.atelierId).toBe(atelier.id)
    expect([...repository.machines.values()]).toHaveLength(1)
  })

  it('refuses a plain member of that atelier', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)

    const exit = await run(input(atelier.id), [{ atelierId: atelier.id, role: 'MEMBER' }])

    expect(Exit.isFailure(exit)).toBe(true)
    expect([...repository.machines.values()]).toHaveLength(0)
  })

  it('refuses a fabmanager of another atelier', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)

    const exit = await run(input(atelier.id), [{ atelierId: OTHER, role: 'FABMANAGER' }])

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it('refuses a tag already stuck on another machine', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)
    const taken = machineFixture(atelier.id, { nfcTagId: 'tag-trotec' })
    repository.machines.set(taken.id, taken)

    const exit = await run(input(atelier.id, { nfcTagId: 'tag-trotec' }), [
      { atelierId: atelier.id, role: 'FABMANAGER' },
    ])

    expect(Exit.isFailure(exit)).toBe(true)
    expect(JSON.stringify(exit)).toContain('MachineNfcTagTakenError')
    expect([...repository.machines.values()]).toHaveLength(1)
  })
})
