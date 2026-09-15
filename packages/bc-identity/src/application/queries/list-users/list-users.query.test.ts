import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import * as Cause from 'effect/Cause'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { beforeEach, describe, expect, it } from 'vitest'

import { UserStatus } from '../../../domain/user.constants'
import type { AdminUsersParams, User } from '../../../domain/user.schema'
import { Email } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { makeUserRepositoryMemory } from '../../../infrastructure/user.repository.memory'
import { listUsers } from './list-users.query'

const ADMIN = UserId.make('00000000-0000-4000-8000-0000000000a1')

let counter = 0

const userFixture = (overrides: Partial<User> = {}): User => {
  counter += 1
  return {
    id: UserId.make(`00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`),
    email: Email.make(`camille${counter}@etabli.test`),
    passwordHash: 'hash',
    displayName: `Camille ${counter}`,
    platformRole: 'MEMBER',
    practice: ['Bois'],
    onboardingCompletedAt: null,
    status: UserStatus.ACTIVE,
    createdAt: DateTime.unsafeFromDate(new Date(2026, 0, counter)),
    updatedAt: DateTime.unsafeNow(),
    ...overrides,
  }
}

let repository: ReturnType<typeof makeUserRepositoryMemory>

const failureTag = (exit: Exit.Exit<unknown, unknown>): string => {
  if (Exit.isSuccess(exit)) return 'success'
  const failure = Cause.failureOption(exit.cause)
  return Option.isSome(failure) ? ((failure.value as { readonly _tag?: string })._tag ?? 'untagged') : 'defect'
}

const run = (params: AdminUsersParams = {}, caller: 'PLATFORM_ADMIN' | 'MEMBER' = 'PLATFORM_ADMIN') =>
  Effect.runPromiseExit(
    listUsers(params).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(UserRepository, repository),
          Layer.succeed(AuthContext, { userId: ADMIN, platformRole: caller, memberships: [] })
        )
      )
    )
  )

const seed = (users: ReadonlyArray<User>) => {
  repository = makeUserRepositoryMemory(users)
}

beforeEach(() => {
  counter = 0
  seed([])
})

describe('listUsers', () => {
  it('refuses a caller who is not a platform admin', async () => {
    expect(failureTag(await run({}, 'MEMBER'))).toBe('ForbiddenError')
  })

  it('puts the newest account first', async () => {
    seed([userFixture(), userFixture()])

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.map((user) => user.displayName)).toStrictEqual(['Camille 2', 'Camille 1'])
  })

  it('narrows to a platform role', async () => {
    seed([userFixture(), userFixture({ platformRole: 'PLATFORM_ADMIN' })])

    const exit = await run({ platformRole: 'PLATFORM_ADMIN' })

    if (Exit.isFailure(exit)) return
    expect(exit.value.map((user) => user.platformRole)).toStrictEqual(['PLATFORM_ADMIN'])
  })

  it('narrows to a status', async () => {
    seed([userFixture(), userFixture({ status: UserStatus.SUSPENDED })])

    const exit = await run({ status: UserStatus.SUSPENDED })

    if (Exit.isFailure(exit)) return
    expect(exit.value).toHaveLength(1)
  })

  it('searches the name as well as the address', async () => {
    seed([userFixture({ displayName: 'Inès Ferrand' }), userFixture({ email: Email.make('ines@atelier.test') })])

    const byName = await run({ search: 'ferrand' })
    const byAddress = await run({ search: 'atelier.test' })

    if (Exit.isFailure(byName) || Exit.isFailure(byAddress)) return
    expect(byName.value).toHaveLength(1)
    expect(byAddress.value).toHaveLength(1)
  })

  it('never hands back the password hash', async () => {
    seed([userFixture()])

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value[0]).not.toHaveProperty('passwordHash')
  })
})
