import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { UnauthorizedError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { CurrentUser } from '../../../domain/user.schema'
import { toCurrentUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'

export const getCurrentUser: Effect.Effect<CurrentUser, UnauthorizedError | RepoError, AuthContext | UserRepository> =
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* UserRepository

    const user = yield* repository.findById(auth.userId)
    if (user === null) return yield* Effect.fail(new UnauthorizedError({ reason: 'account no longer exists' }))

    return toCurrentUser(user)
  })
