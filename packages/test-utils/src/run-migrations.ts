import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SqlClient } from '@effect/sql'
import { findMigrations } from '@etabli/shared/migrations'
import * as Effect from 'effect/Effect'

const splitStatements = (body: string): ReadonlyArray<string> =>
  body
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)

const runFile = (path: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    for (const statement of splitStatements(readFileSync(path, 'utf8'))) {
      yield* sql.unsafe(statement)
    }
  })

export const runMigrationsFromDir = (dir: string) =>
  Effect.gen(function* () {
    for (const filename of readdirSync(dir)
      .filter((file) => file.endsWith('.sql'))
      .toSorted()) {
      yield* runFile(join(dir, filename))
    }
  })

export const runAllMigrations = () =>
  Effect.gen(function* () {
    for (const migration of findMigrations()) {
      yield* runFile(migration.path)
    }
  })
