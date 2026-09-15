import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { UserPreferences } from '../../../domain/preferences.schema'
import { defaultPreferences } from '../../../domain/preferences.schema'
import { PreferencesRepository } from '../../../infrastructure/preferences.repository'

export const getPreferences: Effect.Effect<UserPreferences, RepoError, AuthContext | PreferencesRepository> =
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* PreferencesRepository

    const stored = yield* repository.findByUserId(auth.userId)
    return stored ?? defaultPreferences(auth.userId)
  })
