import { Global, Module } from '@nestjs/common'

import { ENV } from './config.token.ts'
import { readEnv } from './env.schema.ts'

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => readEnv() }],
  exports: [ENV],
})
export class ConfigModule {}
