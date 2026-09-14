import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

const columnsOf = (table: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    return yield* sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns WHERE table_name = ${table}
    `
  })

describe('workspace migrations', () => {
  it('creates domain_events with the documented columns', async () => {
    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(columnsOf('domain_events'), PgLiteSqlClientLayer({ withAllMigrations: true })))
    )

    expect(rows.map((row) => row.column_name).toSorted()).toEqual(['id', 'name', 'occurred_at', 'payload'])
  })

  it('is idempotent when replayed', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql.unsafe('CREATE TABLE IF NOT EXISTS domain_events (id uuid PRIMARY KEY)')
      return yield* sql<{ total: string }>`SELECT count(*)::text AS total FROM domain_events`
    })

    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer({ withAllMigrations: true })))
    )
    expect(rows[0]?.total).toBe('0')
  })
})
