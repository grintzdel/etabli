import type { AuthMembership } from '@etabli/shared/auth-context'
import { AuthContext } from '@etabli/shared/auth-context'
import { AtelierId, UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import type { UpdatePreferences } from '../../../domain/preferences.schema'
import { PreferencesRepository } from '../../../infrastructure/preferences.repository'
import { makePreferencesRepositoryMemory } from '../../../infrastructure/preferences.repository.memory'
import { updatePreferences } from './update-preferences.command'

const USER = UserId.make('00000000-0000-4000-8000-0000000000a1')
const JOINED = AtelierId.make('00000000-0000-4000-8000-0000000000b1')
const STRANGER = AtelierId.make('00000000-0000-4000-8000-0000000000b2')

const MEMBER_OF_JOINED: ReadonlyArray<AuthMembership> = [{ atelierId: JOINED, role: 'MEMBER' }]

let repository: ReturnType<typeof makePreferencesRepositoryMemory>

const run = (patch: UpdatePreferences, memberships: ReadonlyArray<AuthMembership> = MEMBER_OF_JOINED) =>
  Effect.runPromiseExit(
    updatePreferences(patch).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(PreferencesRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships }),
          ClockSystemLive
        )
      )
    )
  )

beforeEach(() => {
  repository = makePreferencesRepositoryMemory()
})

describe('updatePreferences', () => {
  it('stores the theme and stamps the moment it changed', async () => {
    const exit = await run({ theme: 'light' })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.theme).toBe('light')
      expect(exit.value.updatedAt).not.toBeNull()
    }
  })

  it('leaves the default atelier alone when the patch only names the theme', async () => {
    await run({ defaultAtelierId: JOINED })

    const exit = await run({ theme: 'dark' })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.theme).toBe('dark')
      expect(exit.value.defaultAtelierId).toBe(JOINED)
    }
  })

  it('leaves the theme alone when the patch only names the default atelier', async () => {
    await run({ theme: 'light' })

    const exit = await run({ defaultAtelierId: JOINED })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.theme).toBe('light')
      expect(exit.value.defaultAtelierId).toBe(JOINED)
    }
  })

  it('clears the default atelier on an explicit null', async () => {
    await run({ defaultAtelierId: JOINED })

    const exit = await run({ defaultAtelierId: null })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) expect(exit.value.defaultAtelierId).toBeNull()
  })

  it('refuses an atelier the member never joined', async () => {
    const exit = await run({ defaultAtelierId: STRANGER })

    expect(Exit.isFailure(exit)).toBe(true)
    expect(JSON.stringify(exit)).toContain('PreferredAtelierNotJoinedError')
  })

  it('falls back to the system theme when nothing was ever stored', async () => {
    const exit = await run({ defaultAtelierId: JOINED })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) expect(exit.value.theme).toBe('system')
  })
})
