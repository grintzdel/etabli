import * as SqlClient from '@effect/sql/SqlClient'
import { RepoError } from '@etabli/shared/errors'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { DEFAULT_THEME } from '../domain/preferences.constants'
import type { UserPreferences } from '../domain/preferences.schema'
import { PreferencesRepository } from './preferences.repository'

interface PreferencesRow {
  readonly user_id: string
  readonly theme: string
  readonly default_atelier_id: string | null
  readonly updated_at: Date
}

const toPreferences = (row: PreferencesRow): UserPreferences => ({
  userId: row.user_id as UserPreferences['userId'],
  theme: row.theme as UserPreferences['theme'],
  defaultAtelierId: row.default_atelier_id as UserPreferences['defaultAtelierId'],
  updatedAt: DateTime.unsafeFromDate(row.updated_at),
})

const fail = (operation: string) => (cause: unknown) => new RepoError({ cause, operation })

export const makePreferencesRepositorySql = (sql: SqlClient.SqlClient) =>
  PreferencesRepository.of({
    findByUserId: (userId) =>
      sql<PreferencesRow>`SELECT * FROM user_preferences WHERE user_id = ${userId} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toPreferences(rows[0]))),
        Effect.mapError(fail('user_preferences.findByUserId'))
      ),

    upsert: (userId, patch, at) => {
      const theme = patch.theme ?? null
      const atelierGiven = patch.defaultAtelierId !== undefined
      const atelierId = patch.defaultAtelierId ?? null

      return sql<PreferencesRow>`
        INSERT INTO user_preferences (user_id, theme, default_atelier_id, updated_at)
        VALUES (
          ${userId},
          COALESCE(${theme}::text, ${DEFAULT_THEME}),
          ${atelierGiven ? atelierId : null}::uuid,
          ${DateTime.toDate(at)}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          theme = COALESCE(${theme}::text, user_preferences.theme),
          default_atelier_id = CASE
            WHEN ${atelierGiven} THEN ${atelierId}::uuid
            ELSE user_preferences.default_atelier_id
          END,
          updated_at = ${DateTime.toDate(at)}
        RETURNING *
      `.pipe(
        Effect.flatMap((rows) =>
          rows[0] === undefined
            ? Effect.fail(new RepoError({ cause: 'no row returned', operation: 'user_preferences.upsert' }))
            : Effect.succeed(toPreferences(rows[0]))
        ),
        Effect.mapError(fail('user_preferences.upsert'))
      )
    },
  })

export const PreferencesRepositorySqlLayer = Layer.effect(
  PreferencesRepository,
  Effect.map(SqlClient.SqlClient, makePreferencesRepositorySql)
)
