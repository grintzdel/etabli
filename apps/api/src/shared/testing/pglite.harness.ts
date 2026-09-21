import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

import type { Database } from '../../infrastructure/database/database.token.ts'
import { MIGRATIONS_FOLDER } from '../../infrastructure/database/migrations.path.ts'
import * as schema from '../../infrastructure/database/schema/index.ts'

export interface TestDatabase {
  readonly db: Database
  close(): Promise<void>
}

export const makeTestDatabase = async (): Promise<TestDatabase> => {
  const client = new PGlite({ extensions: { btree_gist } })
  await client.waitReady

  const db = drizzle(client, { schema, casing: 'snake_case' })
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })

  return {
    db: db as unknown as Database,
    close: async () => {
      await client.close()
    },
  }
}
