import * as SqlClient from '@effect/sql/SqlClient'
import { RepoError } from '@etabli/shared/errors'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { UserStatus } from '../domain/user.constants'
import type { Email, User } from '../domain/user.schema'
import { Email as EmailSchema } from '../domain/user.schema'
import { UserRepository } from './user.repository'

interface UserRow {
  readonly id: string
  readonly email: string
  readonly password_hash: string
  readonly display_name: string
  readonly platform_role: string
  readonly practice: ReadonlyArray<string> | null
  readonly onboarding_completed_at: Date | null
  readonly status: string
  readonly created_at: Date
  readonly updated_at: Date
}

const toUser = (row: UserRow): User => ({
  id: row.id as User['id'],
  email: EmailSchema.make(row.email),
  passwordHash: row.password_hash,
  displayName: row.display_name,
  platformRole: row.platform_role as User['platformRole'],
  practice: row.practice ?? [],
  onboardingCompletedAt:
    row.onboarding_completed_at === null ? null : DateTime.unsafeFromDate(row.onboarding_completed_at),
  status: row.status as UserStatus,
  createdAt: DateTime.unsafeFromDate(row.created_at),
  updatedAt: DateTime.unsafeFromDate(row.updated_at),
})

const fail = (operation: string) => (cause: unknown) => new RepoError({ cause, operation })

const toPgTextArray = (values: ReadonlyArray<string>): string =>
  `{${values.map((value) => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`).join(',')}}`

export const makeUserRepositorySql = (sql: SqlClient.SqlClient) =>
  UserRepository.of({
    findByEmail: (email: Email) =>
      sql<UserRow>`SELECT * FROM users WHERE email = ${email} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toUser(rows[0]))),
        Effect.mapError(fail('users.findByEmail'))
      ),

    findById: (id) =>
      sql<UserRow>`SELECT * FROM users WHERE id = ${id} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toUser(rows[0]))),
        Effect.mapError(fail('users.findById'))
      ),

    updateProfile: (id, patch, at) => {
      const practice = patch.practice === undefined ? null : toPgTextArray(patch.practice)

      return sql<UserRow>`
        UPDATE users
        SET display_name = COALESCE(${patch.displayName ?? null}::text, display_name),
            practice = COALESCE(${practice}::text[], practice),
            updated_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toUser(rows[0]))),
        Effect.mapError(fail('users.updateProfile'))
      )
    },

    markOnboarded: (id, practice, at) =>
      sql<UserRow>`
        UPDATE users
        SET practice = ${toPgTextArray(practice)}::text[],
            onboarding_completed_at = ${DateTime.toDate(at)},
            updated_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toUser(rows[0]))),
        Effect.mapError(fail('users.markOnboarded'))
      ),

    insert: (user) =>
      sql<UserRow>`
        INSERT INTO users (id, email, password_hash, display_name, platform_role, practice, onboarding_completed_at, status, created_at, updated_at)
        VALUES (
          ${user.id},
          ${user.email},
          ${user.passwordHash},
          ${user.displayName},
          ${user.platformRole},
          ${toPgTextArray(user.practice)}::text[],
          ${user.onboardingCompletedAt === null ? null : DateTime.toDate(user.onboardingCompletedAt)},
          ${user.status},
          ${DateTime.toDate(user.createdAt)},
          ${DateTime.toDate(user.updatedAt)}
        )
        RETURNING *
      `.pipe(
        Effect.flatMap((rows) =>
          rows[0] === undefined
            ? Effect.fail(new RepoError({ cause: 'no row returned', operation: 'users.insert' }))
            : Effect.succeed(toUser(rows[0]))
        ),
        Effect.mapError(fail('users.insert'))
      ),
  })

export const UserRepositorySqlLayer = Layer.effect(
  UserRepository,
  Effect.map(SqlClient.SqlClient, makeUserRepositorySql)
)
