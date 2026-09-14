import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { Email, User } from '../domain/user.schema'

export interface UserRepositoryService {
  readonly findByEmail: (email: Email) => Effect.Effect<User | null, RepoError>
  readonly findById: (id: UserId) => Effect.Effect<User | null, RepoError>
  readonly insert: (user: User) => Effect.Effect<User, RepoError>
}

export class UserRepository extends Context.Tag('@etabli/UserRepository')<UserRepository, UserRepositoryService>() {}
