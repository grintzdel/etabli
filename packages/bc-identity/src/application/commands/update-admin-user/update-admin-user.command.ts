import { AuthContext, isPlatformAdmin, PlatformRole } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { AdminSelfLockoutError, UserUnknownError } from '../../../domain/errors'
import { UserStatus } from '../../../domain/user.constants'
import type { AdminUser, UpdateAdminUser } from '../../../domain/user.schema'
import { toAdminUser } from '../../../domain/user.schema'
import { UserRepository } from '../../../infrastructure/user.repository'

const locksItselfOut = (patch: UpdateAdminUser): boolean =>
  patch.platformRole === PlatformRole.MEMBER || patch.status === UserStatus.SUSPENDED

export const updateAdminUser = (
  userId: UserId,
  patch: UpdateAdminUser
): Effect.Effect<
  AdminUser,
  AdminSelfLockoutError | ForbiddenError | UserUnknownError | RepoError,
  AuthContext | Clock | UserRepository
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* UserRepository
    const clock = yield* Clock

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin changes an account' }))
    }

    if (auth.userId === userId && locksItselfOut(patch)) {
      return yield* Effect.fail(new AdminSelfLockoutError())
    }

    const now = yield* clock.now
    const updated = yield* repository.updateAdminState(userId, patch, now)
    return updated === null ? yield* Effect.fail(new UserUnknownError({ userId })) : toAdminUser(updated)
  })
