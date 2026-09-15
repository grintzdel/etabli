import { AuthContext } from '@etabli/shared/auth-context'
import type { AtelierId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture, membershipFixture } from '../../../__tests__/atelier.factory'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { setMembershipRole } from './set-membership-role.command'

const ADMIN = UserId.make('00000000-0000-4000-8000-0000000000a1')
const CAMILLE = UserId.make('00000000-0000-4000-8000-0000000000c1')
const STRANGER = UserId.make('00000000-0000-4000-8000-0000000000ff')

const FORGE = atelierFixture({ name: 'La Forge' })

let repository: ReturnType<typeof makeAtelierRepositoryMemory>

const failureTag = (exit: Exit.Exit<unknown, unknown>): string => {
  if (Exit.isSuccess(exit)) return 'success'
  const failure = Cause.failureOption(exit.cause)
  return Option.isSome(failure) ? ((failure.value as { readonly _tag?: string })._tag ?? 'untagged') : 'defect'
}

const run = (
  userId: UserId,
  role: 'MEMBER' | 'FABMANAGER',
  caller: 'PLATFORM_ADMIN' | 'MEMBER' = 'PLATFORM_ADMIN',
  atelierId: AtelierId = FORGE.id
) =>
  Effect.runPromiseExit(
    setMembershipRole(atelierId, userId, { role }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AtelierRepository, repository),
          Layer.succeed(AuthContext, { userId: ADMIN, platformRole: caller, memberships: [] })
        )
      )
    )
  )

beforeEach(async () => {
  repository = makeAtelierRepositoryMemory()
  await Effect.runPromise(repository.insertAtelier(FORGE))
  await Effect.runPromise(repository.insertMembership(membershipFixture(FORGE.id, { userId: CAMILLE })))
})

describe('setMembershipRole', () => {
  it('names a member fabmanager of the atelier it belongs to', async () => {
    const exit = await run(CAMILLE, 'FABMANAGER')

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.role).toBe('FABMANAGER')
    expect(exit.value.atelierId).toBe(FORGE.id)
  })

  it('takes the role back', async () => {
    await run(CAMILLE, 'FABMANAGER')
    const exit = await run(CAMILLE, 'MEMBER')

    if (Exit.isFailure(exit)) return
    expect(exit.value.role).toBe('MEMBER')
  })

  it('refuses a caller who is not a platform admin', async () => {
    expect(failureTag(await run(CAMILLE, 'FABMANAGER', 'MEMBER'))).toBe('ForbiddenError')
  })

  it('answers on an account that never joined the atelier', async () => {
    expect(failureTag(await run(STRANGER, 'FABMANAGER'))).toBe('MembershipUnknownError')
  })
})
