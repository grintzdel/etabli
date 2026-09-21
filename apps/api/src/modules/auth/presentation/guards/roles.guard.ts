import { ApiErrorCode } from '@etabli/contract'
import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ROLES_KEY } from '../../../../infrastructure/decorators/roles.decorator.ts'
import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { PlatformRole } from '../../../../shared/domain/roles.constant.ts'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ReadonlyArray<PlatformRole> | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (required === undefined || required.length === 0) return true

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>()
    if (user === undefined || !required.includes(user.platformRole)) {
      throw new ForbiddenException({ code: ApiErrorCode.FORBIDDEN, message: 'Ce geste demande un autre rôle' })
    }

    return true
  }
}
