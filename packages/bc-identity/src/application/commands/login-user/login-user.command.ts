import { AccountSuspendedError } from '@etabli/shared/errors'
import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import { InvalidCredentialsError } from '../../../domain/errors'
import { UserStatus } from '../../../domain/user.constants'
import type { LoginPayload, Session } from '../../../domain/user.schema'
import { toCurrentUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { MembershipLookup } from '../../ports/membership-lookup'
import { PasswordHasher } from '../../ports/password-hasher'
import { TokenIssuer } from '../../ports/token-issuer'

export const loginUser = (
  payload: LoginPayload
): Effect.Effect<
  Session,
  InvalidCredentialsError | AccountSuspendedError | RepoError,
  UserRepository | PasswordHasher | TokenIssuer | MembershipLookup
> =>
  Effect.gen(function* () {
    const repository = yield* UserRepository
    const hasher = yield* PasswordHasher
    const tokens = yield* TokenIssuer
    const memberships = yield* MembershipLookup

    const user = yield* repository.findByEmail(payload.email)

    if (user === null) {
      // Burn one hash on an unknown address: answering faster than a wrong password
      // would reinstate by timing the oracle that §3.6 closes on the message.
      yield* hasher.hash(payload.password)
      return yield* Effect.fail(new InvalidCredentialsError())
    }

    const matches = yield* hasher.verify(payload.password, user.passwordHash)
    if (!matches) return yield* Effect.fail(new InvalidCredentialsError())
    if (user.status === UserStatus.SUSPENDED) return yield* Effect.fail(new AccountSuspendedError())

    const issued = yield* tokens.issue(user.id)
    const joined = yield* memberships.forUser(user.id)
    return { token: issued.token, expiresAt: issued.expiresAt, user: toCurrentUser(user, joined) }
  })
