import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'

import { AUTH_CONTEXT } from './domain/auth-context.token.ts'
import { CLOCK } from './domain/clock.token.ts'
import { AsyncLocalAuthContext } from './infrastructure/async-local.auth-context.ts'
import { SystemClock } from './infrastructure/system.clock.ts'
import { AuthContextInterceptor } from './presentation/interceptors/auth-context.interceptor.ts'

@Global()
@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    AsyncLocalAuthContext,
    { provide: AUTH_CONTEXT, useExisting: AsyncLocalAuthContext },
    { provide: APP_INTERCEPTOR, useClass: AuthContextInterceptor },
  ],
  exports: [CLOCK, AUTH_CONTEXT],
})
export class SharedModule {}
