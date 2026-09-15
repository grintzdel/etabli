import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Cause from 'effect/Cause'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { beforeEach, describe, expect, it } from 'vitest'

import { UserStatus } from '../../../domain/user.constants'
import type { UpdateAdminUser, User } from '../../../domain/user.schema'
import { Email } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { makeUserRepositoryMemory } from '../../../infrastructure/user.repository.memory'
import { updateAdminUser } from './update-admin-user.command'

const ADMIN = UserId.make('00000000-0000-4000-8000-0000000000a1')
const CAMILLE = UserId.make('00000000-0000-4000-8000-0000000000c1')
const GHOST = UserId.make('00000000-0000-4000-8000-0000000000ff')

const userFixture = (overrides: Partial<User> = {}): User => ({
  id: CAMILLE,
  email: Email.make('camille@etabli.test'),
  passwordHash: 'hash',
  displayName: 'Camille Roux',
  platformRole: 'MEMBER',
  practice: ['Bois'],
  onboardingCompletedAt: DateTime.unsafeNow(),
  status: UserStatus.ACTIVE,
  createdAt: DateTime.unsafeNow(),
  updatedAt: DateTime.unsafeNow(),
  ...overrides,
})

let repository: ReturnType<typeof makeUserRepositoryMemory>

const failureTag = (exit: Exit.Exit<unknown, unknown>): string => {
  if (Exit.isSuccess(exit)) return 'success'
  const failure = Cause.failureOption(exit.cause)
  return Option.isSome(failure) ? ((failure.value as { readonly _tag?: string })._tag ?? 'untagged') : 'defect'
}

const run = (userId: UserId, patch: UpdateAdminUser, caller: 'PLATFORM_ADMIN' | 'MEMBER' = 'PLATFORM_ADMIN') =>
  Effect.runPromiseExit(
    updateAdminUser(userId, patch).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(UserRepository, repository),
          Layer.succeed(AuthContext, { userId: ADMIN, platformRole: caller, memberships: [] }),
          ClockSystemLive
        )
      )
    )
  )

beforeEach(() => {
  repository = makeUserRepositoryMemory([
    userFixture(),
    userFixture({ id: ADMIN, email: Email.make('admin@etabli.test'), platformRole: 'PLATFORM_ADMIN' }),
  ])
})

describe('updateAdminUser', () => {
  it('names a member as platform admin', async () => {
    const exit = await run(CAMILLE, { platformRole: 'PLATFORM_ADMIN' })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.platformRole).toBe('PLATFORM_ADMIN')
    expect(exit.value.status).toBe(UserStatus.ACTIVE)
  })

  it('suspends an account without touching its role', async () => {
    const exit = await run(CAMILLE, { status: UserStatus.SUSPENDED })

    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(UserStatus.SUSPENDED)
    expect(exit.value.platformRole).toBe('MEMBER')
  })

  it('leaves untouched what the patch does not name', async () => {
    await run(CAMILLE, { status: UserStatus.SUSPENDED })
    const exit = await run(CAMILLE, { platformRole: 'PLATFORM_ADMIN' })

    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(UserStatus.SUSPENDED)
  })

  it('refuses an admin who would take its own admin role away', async () => {
    expect(failureTag(await run(ADMIN, { platformRole: 'MEMBER' }))).toBe('AdminSelfLockoutError')
  })

  it('refuses an admin who would suspend itself', async () => {
    expect(failureTag(await run(ADMIN, { status: UserStatus.SUSPENDED }))).toBe('AdminSelfLockoutError')
  })

  it('lets an admin reaffirm its own role', async () => {
    expect(Exit.isSuccess(await run(ADMIN, { platformRole: 'PLATFORM_ADMIN' }))).toBe(true)
  })

  it('refuses a caller who is not a platform admin', async () => {
    expect(failureTag(await run(CAMILLE, { status: UserStatus.SUSPENDED }, 'MEMBER'))).toBe('ForbiddenError')
  })

  it('answers on an account that does not exist', async () => {
    expect(failureTag(await run(GHOST, { status: UserStatus.SUSPENDED }))).toBe('UserUnknownError')
  })
})
