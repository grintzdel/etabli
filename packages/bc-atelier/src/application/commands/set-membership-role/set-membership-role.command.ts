import { AuthContext, isPlatformAdmin } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import type { AtelierId, UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import type { Membership, SetMembershipRole } from '../../../domain/atelier.schema'
import { MembershipUnknownError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const setMembershipRole = (
  atelierId: AtelierId,
  userId: UserId,
  payload: SetMembershipRole
): Effect.Effect<Membership, ForbiddenError | MembershipUnknownError | RepoError, AuthContext | AtelierRepository> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin names a fabmanager' }))
    }

    const updated = yield* repository.updateMembershipRole(userId, atelierId, payload.role)
    return updated === null ? yield* Effect.fail(new MembershipUnknownError({ atelierId, userId })) : updated
  })
