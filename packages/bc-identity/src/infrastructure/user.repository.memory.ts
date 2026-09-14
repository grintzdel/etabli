import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { Email, User } from '../domain/user.schema'
import { UserRepository } from './user.repository'

export const makeUserRepositoryMemory = (seed: ReadonlyArray<User> = []) => {
  const byId = new Map<string, User>(seed.map((user) => [user.id, user]))

  return UserRepository.of({
    findByEmail: (email: Email) =>
      Effect.sync(() => [...byId.values()].find((user) => user.email === email.toLowerCase()) ?? null),
    findById: (id) => Effect.sync(() => byId.get(id) ?? null),
    insert: (user) =>
      Effect.sync(() => {
        byId.set(user.id, user)
        return user
      }),
  })
}

export const UserRepositoryMemoryLayer = (seed: ReadonlyArray<User> = []) =>
  Layer.sync(UserRepository, () => makeUserRepositoryMemory(seed))
