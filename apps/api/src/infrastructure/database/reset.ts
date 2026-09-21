import { getTableName, isTable, sql } from 'drizzle-orm'

import type { Database } from './database.token.ts'
import * as schema from './schema/index.ts'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

export const resettableTables = (): ReadonlyArray<string> =>
  Object.values(schema)
    .filter(isTable)
    .map((table) => getTableName(table))
    .toSorted()

export const assertResettable = (databaseUrl: string): void => {
  const hostname = new URL(databaseUrl).hostname.replace(/^\[/, '').replace(/\]$/, '')
  if (LOCAL_HOSTNAMES.has(hostname)) return

  throw new Error(
    `Refus de vider la base hébergée sur ${hostname} : la remise à zéro n'est permise que sur une base locale. ` +
      'Vérifie que DATABASE_URL vient de .env.test.'
  )
}

export const resetDatabase = async (db: Database): Promise<void> => {
  const tables = resettableTables()
    .map((name) => `"${name}"`)
    .join(', ')

  await db.execute(sql.raw(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`))
}
