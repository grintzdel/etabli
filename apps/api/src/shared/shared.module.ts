import { Global, Module } from '@nestjs/common'

import { CLOCK } from './domain/clock.token.ts'
import { SystemClock } from './infrastructure/system.clock.ts'

@Global()
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class SharedModule {}
