import { AuthContext, isPlatformAdmin } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { AdminUser, AdminUsersParams } from '../../../domain/user.schema'
import { toAdminUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'

export const listUsers = (
  params: AdminUsersParams
): Effect.Effect<ReadonlyArray<AdminUser>, ForbiddenError | RepoError, AuthContext | UserRepository> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* UserRepository

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin browses the accounts' }))
    }

    const users = yield* repository.listForAdmin(params)
    return users.map(toAdminUser)
  })
