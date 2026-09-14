import { HttpApiMiddleware, HttpServerRequest } from '@effect/platform'
import { AuthContext } from '@etabli/shared/auth-context'
import { UnauthorizedError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'

import { TokenIssuer } from '../application/ports/token-issuer'
import { AccountSuspendedError } from '../domain/errors'
import { UserStatus } from '../domain/user.constants'
import { UserRepository } from '../infrastructure/user.repository'

const BEARER = /^Bearer (.+)$/

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()('@etabli/AuthMiddleware', {
  failure: Schema.Union(UnauthorizedError, AccountSuspendedError),
  provides: AuthContext,
}) {}

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const tokens = yield* TokenIssuer
    const repository = yield* UserRepository

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

        return AuthContext.of({ userId: user.id, platformRole: user.platformRole, memberships: [] })
      })
    )
  })
)
