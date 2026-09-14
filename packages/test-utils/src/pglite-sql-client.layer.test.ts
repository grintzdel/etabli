import { join } from 'node:path'

import { SqlClient } from '@effect/sql'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

import { PgLiteSqlClientLayer } from './pglite-sql-client.layer'

const FIXTURES = join(import.meta.dirname, '../test-fixtures')

describe('PgLiteSqlClientLayer', () => {
  it('runs a query against an in-memory postgres', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql<{ answer: number }>`SELECT 42 AS answer`
    })

    const rows = await Effect.runPromise(Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer())))
    expect(rows[0]?.answer).toBe(42)
  })

  it('applies the migrations of a directory before handing the client over', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`INSERT INTO widgets ${sql.insert({ id: 1, label: 'laser' })}`
      return yield* sql<{ label: string }>`SELECT label FROM widgets`
    })

    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer({ migrationsDir: FIXTURES })))
    )
    expect(rows.map((row) => row.label)).toEqual(['laser'])
  })

  it('applies every workspace migration when asked', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql<{ table_name: string }>`
        SELECT table_name FROM information_schema.tables WHERE table_name = 'domain_events'
      `
    })

    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer({ withAllMigrations: true })))
    )
    expect(rows).toHaveLength(1)
  })

  it('gives each layer instance its own isolated database', async () => {
    const insert = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`INSERT INTO widgets ${sql.insert({ id: 1, label: 'cnc' })}`
    })
    const count = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql<{ total: string }>`SELECT count(*)::text AS total FROM widgets`
    })

    await Effect.runPromise(Effect.scoped(Effect.provide(insert, PgLiteSqlClientLayer({ migrationsDir: FIXTURES }))))
    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(count, PgLiteSqlClientLayer({ migrationsDir: FIXTURES })))
    )

    expect(rows[0]?.total).toBe('0')
  })
})
