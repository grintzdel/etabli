import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as DateTime from 'effect/DateTime'
import type * as Effect from 'effect/Effect'

import type { AdminUsersParams, Email, UpdateAdminUser, UpdateProfile, User } from '../domain/user.schema'

export interface UserRepositoryService {
  readonly findByEmail: (email: Email) => Effect.Effect<User | null, RepoError>
  readonly findById: (id: UserId) => Effect.Effect<User | null, RepoError>
  readonly insert: (user: User) => Effect.Effect<User, RepoError>
  readonly listForAdmin: (params: AdminUsersParams) => Effect.Effect<ReadonlyArray<User>, RepoError>
  readonly updateAdminState: (
    id: UserId,
    patch: UpdateAdminUser,
    at: DateTime.Utc
  ) => Effect.Effect<User | null, RepoError>
  readonly updateProfile: (id: UserId, patch: UpdateProfile, at: DateTime.Utc) => Effect.Effect<User | null, RepoError>
  readonly updatePasswordHash: (
    id: UserId,
    passwordHash: string,
    at: DateTime.Utc
  ) => Effect.Effect<User | null, RepoError>
  readonly markOnboarded: (
    id: UserId,
    practice: ReadonlyArray<string>,
    at: DateTime.Utc
  ) => Effect.Effect<User | null, RepoError>
}

export class UserRepository extends Context.Tag('@etabli/UserRepository')<UserRepository, UserRepositoryService>() {}
