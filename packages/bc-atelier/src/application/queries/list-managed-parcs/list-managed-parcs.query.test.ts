import type { AuthMembership } from '@etabli/shared/auth-context'
import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, machineFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus } from '../../../domain/atelier.constants'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { listManagedParcs } from './list-managed-parcs.query'

const USER = UserId.make('00000000-0000-4000-8000-0000000000f1')

let repository: AtelierRepositoryMemory

const run = (memberships: ReadonlyArray<AuthMembership>) =>
  Effect.runPromiseExit(
    listManagedParcs().pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AtelierRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships })
        )
      )
    )
  )

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
})

describe('listManagedParcs', () => {
  it('answers the parc of each atelier the user fabmanages', async () => {
    const forge = atelierFixture({ name: 'La Forge' })
    repository.ateliers.set(forge.id, forge)
    const machine = machineFixture(forge.id, { name: 'Trotec' })
    repository.machines.set(machine.id, machine)

    const exit = await run([{ atelierId: forge.id, role: 'FABMANAGER' }])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toHaveLength(1)
    expect(exit.value[0]?.atelier.name).toBe('La Forge')
    expect(exit.value[0]?.machines.map((item) => item.name)).toEqual(['Trotec'])
  })

  it('shows a draft atelier, which the public directory hides', async () => {
    const draft = atelierFixture({ status: AtelierStatus.DRAFT })
    repository.ateliers.set(draft.id, draft)

    const exit = await run([{ atelierId: draft.id, role: 'FABMANAGER' }])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toHaveLength(1)
  })

  it('keeps out the ateliers where the user is a plain member', async () => {
    const forge = atelierFixture()
    repository.ateliers.set(forge.id, forge)

    const exit = await run([{ atelierId: forge.id, role: 'MEMBER' }])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })

  it('answers nothing to a user who fabmanages nothing', async () => {
    const exit = await run([])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })
})
