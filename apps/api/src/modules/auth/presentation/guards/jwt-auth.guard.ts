import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { SessionExpiredError } from '../../domain/errors/auth.errors.ts'
import type { IAuthContextLoader } from '../../domain/services/auth-context-loader.interface.ts'
import { AUTH_CONTEXT_LOADER } from '../../domain/services/auth-context-loader.token.ts'

const BEARER = /^Bearer (.+)$/

interface AuthenticatedRequest {
  readonly headers: Record<string, string | ReadonlyArray<string> | undefined>
  user?: AuthUser
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_CONTEXT_LOADER) private readonly loader: IAuthContextLoader) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const header = request.headers['authorization']
    const token = typeof header === 'string' ? (BEARER.exec(header)?.[1] ?? null) : null
    if (token === null) throw new SessionExpiredError('missing bearer token')

    request.user = await this.loader.fromBearerToken(token)
    return true
  }
}
