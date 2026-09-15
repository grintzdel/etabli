import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { ADMIN_USERS_LIMIT } from '../domain/user.constants'
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
    updateProfile: (id, patch, at) =>
      Effect.sync(() => {
        const user = byId.get(id)
        if (user === undefined) return null
        const updated = {
          ...user,
          displayName: patch.displayName ?? user.displayName,
          practice: patch.practice ?? user.practice,
          updatedAt: at,
        }
        byId.set(id, updated)
        return updated
      }),
    updatePasswordHash: (id, passwordHash, at) =>
      Effect.sync(() => {
        const user = byId.get(id)
        if (user === undefined) return null
        const updated = { ...user, passwordHash, updatedAt: at }
        byId.set(id, updated)
        return updated
      }),
    listForAdmin: (params) =>
      Effect.sync(() => {
        const needle = params.search?.toLowerCase()
        return [...byId.values()]
          .filter((user) => params.platformRole === undefined || user.platformRole === params.platformRole)
          .filter((user) => params.status === undefined || user.status === params.status)
          .filter(
            (user) =>
              needle === undefined ||
              user.email.toLowerCase().includes(needle) ||
              user.displayName.toLowerCase().includes(needle)
          )
          .toSorted((left, right) => DateTime.toEpochMillis(right.createdAt) - DateTime.toEpochMillis(left.createdAt))
          .slice(0, ADMIN_USERS_LIMIT)
      }),
    updateAdminState: (id, patch, at) =>
      Effect.sync(() => {
        const user = byId.get(id)
        if (user === undefined) return null
        const updated = {
          ...user,
          platformRole: patch.platformRole ?? user.platformRole,
          status: patch.status ?? user.status,
          updatedAt: at,
        }
        byId.set(id, updated)
        return updated
      }),
    markOnboarded: (id, practice, at) =>
      Effect.sync(() => {
        const user = byId.get(id)
        if (user === undefined) return null
        const updated = { ...user, practice, onboardingCompletedAt: at, updatedAt: at }
        byId.set(id, updated)
        return updated
      }),
  })
}

export const UserRepositoryMemoryLayer = (seed: ReadonlyArray<User> = []) =>
  Layer.sync(UserRepository, () => makeUserRepositoryMemory(seed))
