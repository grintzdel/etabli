import type { UnauthorizedError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as DateTime from 'effect/DateTime'
import type * as Effect from 'effect/Effect'

export interface IssuedToken {
  readonly token: string
  readonly expiresAt: DateTime.Utc
}

export interface TokenClaims {
  readonly userId: UserId
}

export interface TokenIssuerService {
  readonly issue: (userId: UserId) => Effect.Effect<IssuedToken>
  readonly verify: (token: string) => Effect.Effect<TokenClaims, UnauthorizedError>
}

export class TokenIssuer extends Context.Tag('@etabli/TokenIssuer')<TokenIssuer, TokenIssuerService>() {}
