import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { AppModule } from '../../app.module.ts'
import { readEnv } from '../../infrastructure/config/env.schema.ts'
import { type Database, DATABASE_CONNECTION } from '../../infrastructure/database/database.token.ts'
import { TOKEN_ISSUER } from '../../modules/auth/domain/services/token-issuer.token.ts'
import { TokenIssuerJose } from '../../modules/auth/infrastructure/services/token-issuer.jose.ts'
import { CLOCK } from '../domain/clock.token.ts'
import { SystemClock } from '../infrastructure/system.clock.ts'
import { FixedClock } from './fixed.clock.ts'
import { makeTestDatabase } from './pglite.harness.ts'

export interface TestApp {
  readonly app: INestApplication
  readonly db: Database
  readonly clock: FixedClock
  close(): Promise<void>
}

export const DEFAULT_TEST_NOW = '2026-09-15T10:00:00.000Z'

export const makeTestApp = async (now: string = DEFAULT_TEST_NOW): Promise<TestApp> => {
  const database = await makeTestDatabase()
  const clock = new FixedClock(now)

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DATABASE_CONNECTION)
    .useValue(database.db)
    .overrideProvider(CLOCK)
    .useValue(clock)
    .overrideProvider(TOKEN_ISSUER)
    .useValue(new TokenIssuerJose(readEnv(), new SystemClock()))
    .compile()

  const app = moduleRef.createNestApplication()
  await app.init()

  return {
    app,
    db: database.db,
    clock,
    close: async () => {
      await app.close()
      await database.close()
    },
  }
}
