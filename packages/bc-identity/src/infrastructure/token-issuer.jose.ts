import { UnauthorizedError } from '@etabli/shared/errors'
import { UserId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Config from 'effect/Config'
import * as DateTime from 'effect/DateTime'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import * as Schema from 'effect/Schema'
import { jwtVerify, SignJWT } from 'jose'

import { TokenIssuer } from '../application/ports/token-issuer'
import { SESSION_TTL_SECONDS } from '../domain/user.constants'

const ALGORITHM = 'HS256'

const toSeconds = (instant: DateTime.Utc): number => Math.floor(DateTime.toEpochMillis(instant) / 1000)

export const makeTokenIssuerJose = (secret: string, clock: Clock['Type']) => {
  const key = new TextEncoder().encode(secret)

  return TokenIssuer.of({
    issue: (userId) =>
      Effect.gen(function* () {
        const now = yield* clock.now
        const expiresAt = DateTime.addDuration(now, Duration.seconds(SESSION_TTL_SECONDS))

        const token = yield* Effect.promise(() =>
          new SignJWT({})
            .setProtectedHeader({ alg: ALGORITHM })
            .setSubject(userId)
            .setIssuedAt(toSeconds(now))
            .setExpirationTime(toSeconds(expiresAt))
            .sign(key)
        )

        return { token, expiresAt }
      }),

    verify: (token) =>
      Effect.tryPromise({
        try: () => jwtVerify(token, key, { algorithms: [ALGORITHM] }),
        catch: () => new UnauthorizedError({ reason: 'invalid or expired token' }),
      }).pipe(
        Effect.flatMap(({ payload }) =>
          Schema.decodeUnknown(UserId)(payload.sub).pipe(
            Effect.mapError(() => new UnauthorizedError({ reason: 'token carries no usable subject' })),
            Effect.map((userId) => ({ userId }))
          )
        )
      ),
  })
}

export const TokenIssuerJoseLayer = Layer.effect(
  TokenIssuer,
  Effect.gen(function* () {
    const secret = yield* Config.redacted('JWT_SECRET')
    const clock = yield* Clock
    return makeTokenIssuerJose(Redacted.value(secret), clock)
  })
)
