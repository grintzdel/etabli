import { AuthContext } from '@etabli/shared/auth-context'
import { AtelierId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { PreferencesRepository } from '../../../infrastructure/preferences.repository'
import { makePreferencesRepositoryMemory } from '../../../infrastructure/preferences.repository.memory'
import { getPreferences } from './get-preferences.query'

const USER = UserId.make('00000000-0000-4000-8000-0000000000a1')
const ATELIER = AtelierId.make('00000000-0000-4000-8000-0000000000b1')

let repository: ReturnType<typeof makePreferencesRepositoryMemory>

const run = () =>
  Effect.runPromiseExit(
    getPreferences.pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(PreferencesRepository, repository),
          Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships: [] })
        )
      )
    )
  )

beforeEach(() => {
  repository = makePreferencesRepositoryMemory()
})

describe('getPreferences', () => {
  it('answers the defaults when the member never saved anything', async () => {
    const exit = await run()

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual({ userId: USER, theme: 'system', defaultAtelierId: null, updatedAt: null })
    }
  })

  it('answers what was stored', async () => {
    await Effect.runPromise(
      repository.upsert(USER, { theme: 'light', defaultAtelierId: ATELIER }, DateTime.unsafeNow())
    )

    const exit = await run()

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.theme).toBe('light')
      expect(exit.value.defaultAtelierId).toBe(ATELIER)
    }
  })
})
