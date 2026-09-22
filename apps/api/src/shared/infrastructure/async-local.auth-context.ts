import { AsyncLocalStorage } from 'node:async_hooks'

import { ApiErrorCode } from '@etabli/contract'
import { Injectable, UnauthorizedException } from '@nestjs/common'

import type { IAuthContext } from '../domain/auth-context.interface.ts'
import type { AuthUser } from '../domain/auth-user.ts'

@Injectable()
export class AsyncLocalAuthContext implements IAuthContext {
  private readonly storage = new AsyncLocalStorage<AuthUser>()

  runWith<T>(user: AuthUser, fn: () => T): T {
    return this.storage.run(user, fn)
  }

  get user(): AuthUser {
    const user = this.storage.getStore()
    if (user === undefined)
      throw new UnauthorizedException({ code: ApiErrorCode.UNAUTHORIZED, message: 'Session absente' })
    return user
  }
}
