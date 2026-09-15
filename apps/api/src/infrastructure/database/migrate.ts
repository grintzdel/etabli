import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { readEnv } from '../config/env.schema.ts'
import { MIGRATIONS_FOLDER } from './migrations.path.ts'
import * as schema from './schema/index.ts'

const run = async (): Promise<void> => {
  const env = readEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  const db = drizzle(pool, { schema, casing: 'snake_case' })
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  await pool.end()
}

run()
  .then(() => {
    process.stdout.write('migrations applied\n')
  })
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
