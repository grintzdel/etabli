import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { UnauthorizedError } from '@etabli/shared/errors'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import type { CurrentUser, UpdateProfile } from '../../../domain/user.schema'
import { toCurrentUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'

export const updateProfile = (
  patch: UpdateProfile
): Effect.Effect<CurrentUser, UnauthorizedError | RepoError, AuthContext | UserRepository | Clock> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* UserRepository
    const clock = yield* Clock

    const user = yield* repository.updateProfile(auth.userId, patch, yield* clock.now)
    if (user === null) return yield* Effect.fail(new UnauthorizedError({ reason: 'account no longer exists' }))

    return toCurrentUser(user, auth.memberships)
  })
