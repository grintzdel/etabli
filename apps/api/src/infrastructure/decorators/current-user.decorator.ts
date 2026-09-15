import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common'

import type { AuthUser } from '../../shared/domain/auth-user.ts'

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
  if (request.user === undefined) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Session absente' })
  return request.user
})
