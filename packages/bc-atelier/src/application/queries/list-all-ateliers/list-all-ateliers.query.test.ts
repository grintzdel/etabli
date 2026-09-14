import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, machineFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus, MachineStatus } from '../../../domain/atelier.constants'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { listAllAteliers } from './list-all-ateliers.query'

const ADMIN = UserId.make('00000000-0000-4000-8000-0000000000a1')

let repository: AtelierRepositoryMemory

const run = (platformRole: 'MEMBER' | 'PLATFORM_ADMIN' = 'PLATFORM_ADMIN') =>
  Effect.runPromiseExit(
    listAllAteliers().pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AtelierRepository, repository),
          Layer.succeed(AuthContext, { userId: ADMIN, platformRole, memberships: [] })
        )
      )
    )
  )

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
})

describe('listAllAteliers', () => {
  it('answers drafts too, which the public directory never shows', async () => {
    const draft = atelierFixture({ name: 'Brouillon', status: AtelierStatus.DRAFT })
    const published = atelierFixture({ name: 'La Forge', status: AtelierStatus.PUBLISHED })
    repository.ateliers.set(draft.id, draft)
    repository.ateliers.set(published.id, published)

    const exit = await run()

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.map((atelier) => atelier.name)).toEqual(['Brouillon', 'La Forge'])
  })

  it('counts the machines that are still on the floor', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)
    for (const machine of [
      machineFixture(atelier.id),
      machineFixture(atelier.id),
      machineFixture(atelier.id, { status: MachineStatus.RETIRED }),
    ]) {
      repository.machines.set(machine.id, machine)
    }

    const exit = await run()

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.machineCount).toBe(2)
  })

  it('refuses a plain member', async () => {
    expect(Exit.isFailure(await run('MEMBER'))).toBe(true)
  })
})
