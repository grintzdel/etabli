import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { readEnv } from '../config/env.schema.ts'
import * as schema from './schema/index.ts'
import { seed, seedDemo } from './seed.ts'

const run = async (): Promise<void> => {
  const env = readEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  const db = drizzle(pool, { schema, casing: 'snake_case' })
  const report = await seed(db)
  const demo = await seedDemo(db)
  await pool.end()
  process.stdout.write(
    `Seeded ${report.ateliers} ateliers, ${report.machines} machines, ${report.users} users, ` +
      `${report.memberships} memberships, ${demo.certifications} certifications, ${demo.bookings} bookings\n`
  )
}

run().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
})
