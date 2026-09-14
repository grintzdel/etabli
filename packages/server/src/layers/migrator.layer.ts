import { FileSystem } from '@effect/platform'
import { NodeContext } from '@effect/platform-node'
import * as PgMigrator from '@effect/sql-pg/PgMigrator'
import { MigrationError } from '@effect/sql/Migrator'
import * as SqlClient from '@effect/sql/SqlClient'
import { findMigrations } from '@etabli/shared/migrations'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

const loader = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const files = yield* Effect.try({
    try: () => findMigrations(),
    catch: (cause) => new MigrationError({ reason: 'failed', message: `Cannot discover migrations: ${String(cause)}` }),
  })

  return files.map(({ id, name, filename, path }) => {
    const load = Effect.gen(function* () {
      const content = yield* fs
        .readFileString(path)
        .pipe(
          Effect.mapError(
            (error) => new MigrationError({ reason: 'failed', message: `Cannot read ${filename}: ${error.message}` })
          )
        )

      return Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        return yield* sql
          .unsafe(content)
          .pipe(
            Effect.mapError(
              (error) =>
                new MigrationError({ reason: 'failed', message: `Migration ${filename} failed: ${String(error)}` })
            )
          )
      })
    })

    return [id, name, load] as [number, string, typeof load]
  })
})

export const MigratorLive = PgMigrator.layer({ loader }).pipe(Layer.provide(NodeContext.layer))
