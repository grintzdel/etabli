import * as Reactivity from '@effect/experimental/Reactivity'
import { SqlClient } from '@effect/sql'
import type { Connection } from '@effect/sql/SqlConnection'
import { SqlError } from '@effect/sql/SqlError'
import * as Statement from '@effect/sql/Statement'
import { PGlite } from '@electric-sql/pglite'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import { runAllMigrations, runMigrationsFromDir } from './run-migrations'

export interface PgLiteSqlClientLayerOptions {
  readonly migrationsDir?: string
  readonly withAllMigrations?: boolean
}

const makeCompiler = (): Statement.Compiler =>
  Statement.makeCompiler({
    dialect: 'pg',
    placeholder: (index) => `$${index}`,
    onIdentifier: Statement.defaultEscape('"'),
    onRecordUpdate: (placeholders, valueAlias, valueColumns, values, returning) => [
      `(values ${placeholders}) AS ${valueAlias}${valueColumns}${returning ? ` RETURNING ${returning[0]}` : ''}`,
      returning ? values.flat().concat(returning[1]) : values.flat(),
    ],
    onCustom: () => ['', []],
  })

class PgliteConnection implements Connection {
  constructor(private readonly pg: PGlite) {}

  private run(sql: string, params: ReadonlyArray<unknown>) {
    return Effect.tryPromise({
      try: () => this.pg.query<Record<string, unknown>>(sql, params as Array<unknown>),
      catch: (cause) => new SqlError({ cause, message: 'PgliteConnection: query failed' }),
    }).pipe(Effect.map((result) => result.rows))
  }

  execute(
    sql: string,
    params: ReadonlyArray<unknown>,
    transformRows: (<A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
  ) {
    return transformRows ? Effect.map(this.run(sql, params), transformRows) : this.run(sql, params)
  }

  executeRaw(sql: string, params: ReadonlyArray<unknown>) {
    return Effect.tryPromise({
      try: () => this.pg.query<Record<string, unknown>>(sql, params as Array<unknown>),
      catch: (cause) => new SqlError({ cause, message: 'PgliteConnection: executeRaw failed' }),
    })
  }

  executeValues(sql: string, params: ReadonlyArray<unknown>) {
    return Effect.tryPromise({
      try: () => this.pg.query<Record<string, unknown>>(sql, params as Array<unknown>, { rowMode: 'array' }),
      catch: (cause) => new SqlError({ cause, message: 'PgliteConnection: executeValues failed' }),
    }).pipe(Effect.map((result) => result.rows as unknown as ReadonlyArray<ReadonlyArray<unknown>>))
  }

  executeUnprepared(
    sql: string,
    params: ReadonlyArray<unknown>,
    transformRows: (<A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
  ) {
    return transformRows ? Effect.map(this.run(sql, params), transformRows) : this.run(sql, params)
  }

  executeStream(
    sql: string,
    params: ReadonlyArray<unknown>,
    transformRows: (<A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
  ) {
    const rows = transformRows ? Effect.map(this.run(sql, params), transformRows) : this.run(sql, params)
    return Stream.fromIterableEffect(rows)
  }
}

export const PgLiteSqlClientLayer = (
  options: PgLiteSqlClientLayerOptions = {}
): Layer.Layer<SqlClient.SqlClient, SqlError> =>
  Layer.scopedContext(
    Effect.gen(function* () {
      const pg = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            const db = new PGlite()
            await db.waitReady
            return db
          },
          catch: (cause) => new SqlError({ cause, message: 'PgLiteSqlClientLayer: failed to start PGlite' }),
        }),
        (db) => Effect.promise(() => db.close())
      )

      const client = yield* SqlClient.make({
        acquirer: Effect.succeed(new PgliteConnection(pg)),
        compiler: makeCompiler(),
        spanAttributes: [['db.system.name', 'postgresql']],
        transformRows: undefined,
      })

      if (options.withAllMigrations === true) {
        yield* runAllMigrations().pipe(Effect.provideService(SqlClient.SqlClient, client))
      } else if (options.migrationsDir !== undefined) {
        yield* runMigrationsFromDir(options.migrationsDir).pipe(Effect.provideService(SqlClient.SqlClient, client))
      }

      return Context.make(SqlClient.SqlClient, client)
    })
  ).pipe(Layer.provide(Reactivity.layer))
