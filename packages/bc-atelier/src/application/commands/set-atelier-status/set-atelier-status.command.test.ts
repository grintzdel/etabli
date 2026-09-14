import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus } from '../../../domain/atelier.constants'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { setAtelierStatus } from './set-atelier-status.command'

const ADMIN = UserId.make('00000000-0000-4000-8000-0000000000a1')
const UNKNOWN = '00000000-0000-4000-8000-0000000000ff' as ReturnType<typeof atelierFixture>['id']

let repository: AtelierRepositoryMemory

const run = (
  id: ReturnType<typeof atelierFixture>['id'],
  status: AtelierStatus,
  platformRole: 'MEMBER' | 'PLATFORM_ADMIN' = 'PLATFORM_ADMIN'
) =>
  Effect.runPromiseExit(
    setAtelierStatus(id, { status }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AtelierRepository, repository),
          Layer.succeed(AuthContext, { userId: ADMIN, platformRole, memberships: [] }),
          ClockSystemLive
        )
      )
    )
  )

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
})

describe('setAtelierStatus', () => {
  it('publishes a draft, which is what puts it in the directory', async () => {
    const atelier = atelierFixture({ status: AtelierStatus.DRAFT })
    repository.ateliers.set(atelier.id, atelier)

    const exit = await run(atelier.id, AtelierStatus.PUBLISHED)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(AtelierStatus.PUBLISHED)
    expect(repository.ateliers.get(atelier.id)?.status).toBe(AtelierStatus.PUBLISHED)
  })

  it('closes a published atelier', async () => {
    const atelier = atelierFixture({ status: AtelierStatus.PUBLISHED })
    repository.ateliers.set(atelier.id, atelier)

    await run(atelier.id, AtelierStatus.CLOSED)

    expect(repository.ateliers.get(atelier.id)?.status).toBe(AtelierStatus.CLOSED)
  })

  it('refuses a plain member', async () => {
    const atelier = atelierFixture({ status: AtelierStatus.DRAFT })
    repository.ateliers.set(atelier.id, atelier)

    expect(Exit.isFailure(await run(atelier.id, AtelierStatus.PUBLISHED, 'MEMBER'))).toBe(true)
    expect(repository.ateliers.get(atelier.id)?.status).toBe(AtelierStatus.DRAFT)
  })

  it('fails on an atelier that does not exist', async () => {
    expect(Exit.isFailure(await run(UNKNOWN, AtelierStatus.PUBLISHED))).toBe(true)
  })
})
