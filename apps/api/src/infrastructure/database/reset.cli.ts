import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { readEnv } from '../config/env.schema.ts'
import { assertResettable, resetDatabase, resettableTables } from './reset.ts'
import * as schema from './schema/index.ts'

const run = async (): Promise<void> => {
  const env = readEnv()
  assertResettable(env.DATABASE_URL)

  const pool = new Pool({ connectionString: env.DATABASE_URL })
  const db = drizzle(pool, { schema, casing: 'snake_case' })
  await resetDatabase(db)
  await pool.end()
  process.stdout.write(`Truncated ${resettableTables().length} tables\n`)
}

run().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
})
