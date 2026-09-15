import { AuthContext } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { UserStatus } from '../../../domain/user.constants'
import type { UpdateProfile, User } from '../../../domain/user.schema'
import { Email } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { makeUserRepositoryMemory } from '../../../infrastructure/user.repository.memory'
import { updateProfile } from './update-profile.command'

const USER = UserId.make('00000000-0000-4000-8000-0000000000c1')

const seeded = (): User => ({
  id: USER,
  email: Email.make('camille@etabli.test'),
  passwordHash: 'hash',
  displayName: 'Camille Roux',
  platformRole: 'MEMBER',
  practice: ['Bois', 'Métal'],
  onboardingCompletedAt: DateTime.unsafeNow(),
  status: UserStatus.ACTIVE,
  createdAt: DateTime.unsafeNow(),
  updatedAt: DateTime.unsafeNow(),
})

let repository: ReturnType<typeof makeUserRepositoryMemory>

const run = (patch: UpdateProfile) =>
  Effect.runPromiseExit(
    updateProfile(patch).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(UserRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships: [] }),
          ClockSystemLive
        )
      )
    )
  )

beforeEach(() => {
  repository = makeUserRepositoryMemory([seeded()])
})

describe('updateProfile', () => {
  it('renames the member', async () => {
    const exit = await run({ displayName: 'Camille R.' })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) expect(exit.value.displayName).toBe('Camille R.')
  })

  it('leaves the practice alone when the patch only names the display name', async () => {
    const exit = await run({ displayName: 'Camille R.' })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) expect(exit.value.practice).toEqual(['Bois', 'Métal'])
  })

  it('leaves the display name alone when the patch only names the practice', async () => {
    const exit = await run({ practice: ['Textile'] })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.displayName).toBe('Camille Roux')
      expect(exit.value.practice).toEqual(['Textile'])
    }
  })

  it('refuses a member the repository no longer knows', async () => {
    repository = makeUserRepositoryMemory()

    const exit = await run({ displayName: 'Fantôme' })

    expect(Exit.isFailure(exit)).toBe(true)
    expect(JSON.stringify(exit)).toContain('UnauthorizedError')
  })
})
