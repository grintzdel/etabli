import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { readEnv } from '../config/env.schema.ts'
import * as schema from './schema/index.ts'
import { seed } from './seed.ts'

const run = async (): Promise<void> => {
  const env = readEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  const report = await seed(drizzle(pool, { schema, casing: 'snake_case' }))
  await pool.end()
  process.stdout.write(
    `Seeded ${report.ateliers} ateliers, ${report.machines} machines, ${report.users} users, ${report.memberships} memberships\n`
  )
}

run().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
})
