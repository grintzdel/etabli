import { PlatformRole } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { IdGenerator } from '@etabli/shared/id'
import { UserId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { EmailAlreadyTakenError } from '../../../domain/errors'
import { UserStatus } from '../../../domain/user.constants'
import type { RegisterPayload, Session } from '../../../domain/user.schema'
import { toCurrentUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'
import { PasswordHasher } from '../../ports/password-hasher'
import { TokenIssuer } from '../../ports/token-issuer'

export const registerUser = (
  payload: RegisterPayload
): Effect.Effect<
  Session,
  EmailAlreadyTakenError | RepoError,
  UserRepository | PasswordHasher | TokenIssuer | IdGenerator | Clock
> =>
  Effect.gen(function* () {
    const repository = yield* UserRepository
    const hasher = yield* PasswordHasher
    const tokens = yield* TokenIssuer
    const ids = yield* IdGenerator
    const clock = yield* Clock

    const existing = yield* repository.findByEmail(payload.email)
    if (existing !== null) return yield* Effect.fail(new EmailAlreadyTakenError({ email: payload.email }))

    const passwordHash = yield* hasher.hash(payload.password)
    const now = yield* clock.now
    const id = UserId.make(yield* ids.uuid)

    const user = yield* repository.insert({
      id,
      email: payload.email,
      passwordHash,
      displayName: payload.displayName,
      platformRole: PlatformRole.MEMBER,
      practice: [],
      onboardingCompletedAt: null,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    })

    const issued = yield* tokens.issue(user.id)
    return { token: issued.token, expiresAt: issued.expiresAt, user: toCurrentUser(user) }
  })
