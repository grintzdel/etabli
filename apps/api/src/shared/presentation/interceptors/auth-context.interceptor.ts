import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'

import type { AuthUser } from '../../domain/auth-user.ts'
import { AsyncLocalAuthContext } from '../../infrastructure/async-local.auth-context.ts'

@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  constructor(private readonly authContext: AsyncLocalAuthContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>()
    if (user === undefined) return next.handle()

    // The handler runs at subscription, not at handle(): subscribing must happen inside the scope.
    return new Observable((subscriber) => this.authContext.runWith(user, () => next.handle().subscribe(subscriber)))
  }
}
