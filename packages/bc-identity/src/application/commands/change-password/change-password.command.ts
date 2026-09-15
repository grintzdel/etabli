import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { UnauthorizedError } from '@etabli/shared/errors'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { InvalidCredentialsError } from '../../../domain/errors'
import type { ChangePassword, Session } from '../../../domain/user.schema'
import { toCurrentUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { PasswordHasher } from '../../ports/password-hasher'
import { TokenIssuer } from '../../ports/token-issuer'

export const changePassword = (
  payload: ChangePassword
): Effect.Effect<
  Session,
  InvalidCredentialsError | UnauthorizedError | RepoError,
  AuthContext | UserRepository | PasswordHasher | TokenIssuer | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* UserRepository
    const hasher = yield* PasswordHasher
    const tokens = yield* TokenIssuer
    const clock = yield* Clock

    const user = yield* repository.findById(auth.userId)
    if (user === null) return yield* Effect.fail(new UnauthorizedError({ reason: 'account no longer exists' }))

    const matches = yield* hasher.verify(payload.currentPassword, user.passwordHash)
    if (!matches) return yield* Effect.fail(new InvalidCredentialsError())

    const passwordHash = yield* hasher.hash(payload.newPassword)
    const updated = yield* repository.updatePasswordHash(user.id, passwordHash, yield* clock.now)
    if (updated === null) return yield* Effect.fail(new UnauthorizedError({ reason: 'account no longer exists' }))

    const issued = yield* tokens.issue(updated.id)
    return { token: issued.token, expiresAt: issued.expiresAt, user: toCurrentUser(updated, auth.memberships) }
  })
