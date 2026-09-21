import { Inject, Injectable } from '@nestjs/common'
import { jwtVerify, SignJWT } from 'jose'

import { ENV } from '../../../../infrastructure/config/config.token.ts'
import type { Env } from '../../../../infrastructure/config/env.schema.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { JWT_ALGORITHM, SESSION_TTL_SECONDS } from '../../domain/constants/auth.constant.ts'
import { SessionExpiredError } from '../../domain/errors/auth.errors.ts'
import type { IssuedToken, ITokenIssuer, TokenClaims } from '../../domain/services/token-issuer.interface.ts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

@Injectable()
export class TokenIssuerJose implements ITokenIssuer {
  private readonly key: Uint8Array

  constructor(
    @Inject(ENV) env: Env,
    @Inject(CLOCK) private readonly clock: IClock
  ) {
    this.key = new TextEncoder().encode(env.JWT_SECRET)
  }

  async issue(userId: string): Promise<IssuedToken> {
    const now = this.clock.now()
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000)

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setSubject(userId)
      .setIssuedAt(Math.floor(now.getTime() / 1000))
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.key)

    return { token, expiresAt }
  }

  async verify(token: string): Promise<TokenClaims> {
    const verified = await jwtVerify(token, this.key, { algorithms: [JWT_ALGORITHM] }).catch(() => null)
    if (verified === null) throw new SessionExpiredError('invalid or expired token')

    const subject = verified.payload.sub
    if (subject === undefined || !UUID_PATTERN.test(subject)) {
      throw new SessionExpiredError('token carries no usable subject')
    }

    return { userId: subject }
  }
}
