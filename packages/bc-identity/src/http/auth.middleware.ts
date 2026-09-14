import { HttpServerRequest } from '@effect/platform'
import { AuthContext, AuthMiddleware } from '@etabli/shared/auth-context'
import { AccountSuspendedError, UnauthorizedError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { MembershipLookup } from '../application/ports/membership-lookup'
import { TokenIssuer } from '../application/ports/token-issuer'
import { UserStatus } from '../domain/user.constants'
import { UserRepository } from '../infrastructure/user.repository'

const BEARER = /^Bearer (.+)$/

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const tokens = yield* TokenIssuer
    const repository = yield* UserRepository
    const memberships = yield* MembershipLookup

    return AuthMiddleware.of(
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const header = request.headers['authorization']
        const token = header === undefined ? null : (BEARER.exec(header)?.[1] ?? null)
        if (token === null) return yield* Effect.fail(new UnauthorizedError({ reason: 'missing bearer token' }))

        const claims = yield* tokens.verify(token)

        const user = yield* repository
          .findById(claims.userId)
          .pipe(Effect.mapError(() => new UnauthorizedError({ reason: 'cannot load the account' })))

        if (user === null) return yield* Effect.fail(new UnauthorizedError({ reason: 'account no longer exists' }))
        if (user.status === UserStatus.SUSPENDED) return yield* Effect.fail(new AccountSuspendedError())

        const joined = yield* memberships
          .forUser(user.id)
          .pipe(Effect.mapError(() => new UnauthorizedError({ reason: 'cannot load the memberships' })))

        return AuthContext.of({ userId: user.id, platformRole: user.platformRole, memberships: joined })
      })
    )
  })
)
