import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module.ts'
import { ENV } from './infrastructure/config/config.token.ts'
import type { Env } from './infrastructure/config/env.schema.ts'
import { mountSwagger } from './infrastructure/swagger/swagger.ts'

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  mountSwagger(app)

  const env = app.get<Env>(ENV)
  await app.listen(env.PORT)
  process.stdout.write(`Etabli API listening on :${env.PORT} (env=${env.NODE_ENV})\n`)
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
})
