import { Module } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { ConfigModule } from '../config/config.module.ts'
import { ENV } from '../config/config.token.ts'
import type { Env } from '../config/env.schema.ts'
import { DATABASE_CONNECTION } from './database.token.ts'
import * as schema from './schema/index.ts'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ENV],
      useFactory: (env: Env) =>
        drizzle(new Pool({ connectionString: env.DATABASE_URL }), { schema, casing: 'snake_case' }),
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
