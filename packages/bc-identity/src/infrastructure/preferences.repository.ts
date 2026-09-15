import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as DateTime from 'effect/DateTime'
import type * as Effect from 'effect/Effect'

import type { UpdatePreferences, UserPreferences } from '../domain/preferences.schema'

export interface PreferencesRepositoryService {
  readonly findByUserId: (userId: UserId) => Effect.Effect<UserPreferences | null, RepoError>
  readonly upsert: (
    userId: UserId,
    patch: UpdatePreferences,
    at: DateTime.Utc
  ) => Effect.Effect<UserPreferences, RepoError>
}

export class PreferencesRepository extends Context.Tag('@etabli/PreferencesRepository')<
  PreferencesRepository,
  PreferencesRepositoryService
>() {}
