import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { DEFAULT_THEME } from '../domain/preferences.constants'
import type { UserPreferences } from '../domain/preferences.schema'
import { PreferencesRepository } from './preferences.repository'

export const makePreferencesRepositoryMemory = (seed: ReadonlyArray<UserPreferences> = []) => {
  const byUserId = new Map<string, UserPreferences>(seed.map((preferences) => [preferences.userId, preferences]))

  return PreferencesRepository.of({
    findByUserId: (userId) => Effect.sync(() => byUserId.get(userId) ?? null),
    upsert: (userId, patch, at) =>
      Effect.sync(() => {
        const current = byUserId.get(userId)
        const updated: UserPreferences = {
          userId,
          theme: patch.theme ?? current?.theme ?? DEFAULT_THEME,
          defaultAtelierId:
            patch.defaultAtelierId === undefined ? (current?.defaultAtelierId ?? null) : patch.defaultAtelierId,
          updatedAt: at,
        }
        byUserId.set(userId, updated)
        return updated
      }),
  })
}

export const PreferencesRepositoryMemoryLayer = (seed: ReadonlyArray<UserPreferences> = []) =>
  Layer.sync(PreferencesRepository, () => makePreferencesRepositoryMemory(seed))
