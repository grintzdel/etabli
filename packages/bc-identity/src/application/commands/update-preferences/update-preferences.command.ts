import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { PreferredAtelierNotJoinedError } from '../../../domain/errors'
import type { UpdatePreferences, UserPreferences } from '../../../domain/preferences.schema'
import { PreferencesRepository } from '../../../infrastructure/preferences.repository'

export const updatePreferences = (
  patch: UpdatePreferences
): Effect.Effect<
  UserPreferences,
  PreferredAtelierNotJoinedError | RepoError,
  AuthContext | PreferencesRepository | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* PreferencesRepository
    const clock = yield* Clock

    const wanted = patch.defaultAtelierId
    if (wanted != null && !auth.memberships.some((membership) => membership.atelierId === wanted)) {
      return yield* Effect.fail(new PreferredAtelierNotJoinedError({ atelierId: wanted }))
    }

    return yield* repository.upsert(auth.userId, patch, yield* clock.now)
  })
