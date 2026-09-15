import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { UserStatus } from '../../../domain/user.constants'
import type { User } from '../../../domain/user.schema'
import { Email } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { makeUserRepositoryMemory } from '../../../infrastructure/user.repository.memory'
import { PasswordHasher } from '../../ports/password-hasher'
import { TokenIssuer } from '../../ports/token-issuer'
import { changePassword } from './change-password.command'

const USER = UserId.make('00000000-0000-4000-8000-0000000000d1')

const seeded = (): User => ({
  id: USER,
  email: Email.make('camille@etabli.test'),
  passwordHash: 'hash-of-un-mot-de-passe',
  displayName: 'Camille Roux',
  platformRole: 'MEMBER',
  practice: ['Bois'],
  onboardingCompletedAt: null,
  status: UserStatus.ACTIVE,
  createdAt: DateTime.unsafeNow(),
  updatedAt: DateTime.unsafeNow(),
})

const HasherLayer = Layer.succeed(PasswordHasher, {
  hash: (plain) => Effect.succeed(`hash-of-${plain}`),
  verify: (plain, hash) => Effect.succeed(hash === `hash-of-${plain}`),
})

let issued = 0
const TokensLayer = Layer.succeed(TokenIssuer, {
  issue: () =>
    Effect.sync(() => {
      issued += 1
      return { token: `token-${issued}`, expiresAt: DateTime.unsafeNow() }
    }),
  verify: () => Effect.die('unused'),
})

let repository: ReturnType<typeof makeUserRepositoryMemory>

const run = (currentPassword: string, newPassword: string) =>
  Effect.runPromiseExit(
    changePassword({ currentPassword, newPassword }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(UserRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships: [] }),
          HasherLayer,
          TokensLayer,
          ClockSystemLive
        )
      )
    )
  )

beforeEach(() => {
  repository = makeUserRepositoryMemory([seeded()])
})

describe('changePassword', () => {
  it('stores the hash of the new password', async () => {
    const exit = await run('un-mot-de-passe', 'un-autre-mot-de-passe')

    expect(Exit.isSuccess(exit)).toBe(true)
    const stored = await Effect.runPromise(repository.findById(USER))
    expect(stored?.passwordHash).toBe('hash-of-un-autre-mot-de-passe')
  })

  it('hands back a freshly issued token, so the author is not signed out', async () => {
    const exit = await run('un-mot-de-passe', 'un-autre-mot-de-passe')

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.token).toMatch(/^token-/)
      expect(exit.value.user.email).toBe('camille@etabli.test')
    }
  })

  it('refuses a wrong current password and leaves the stored hash alone', async () => {
    const exit = await run('pas-le-bon', 'un-autre-mot-de-passe')

    expect(Exit.isFailure(exit)).toBe(true)
    expect(JSON.stringify(exit)).toContain('InvalidCredentialsError')

    const stored = await Effect.runPromise(repository.findById(USER))
    expect(stored?.passwordHash).toBe('hash-of-un-mot-de-passe')
  })

  it('refuses a member the repository no longer knows', async () => {
    repository = makeUserRepositoryMemory()

    const exit = await run('un-mot-de-passe', 'un-autre-mot-de-passe')

    expect(Exit.isFailure(exit)).toBe(true)
    expect(JSON.stringify(exit)).toContain('UnauthorizedError')
  })
})
