import { AuthContext, MembershipRole, MembershipStatus } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { IdGenerator } from '@etabli/shared/id'
import { MembershipId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import type { CompleteOnboarding, OnboardingResult } from '../../../domain/atelier.schema'
import { AtelierNotJoinableError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import { MemberProfile } from '../../ports/member-profile'

export const completeOnboarding = (
  payload: CompleteOnboarding
): Effect.Effect<
  OnboardingResult,
  AtelierNotJoinableError | RepoError,
  AuthContext | AtelierRepository | MemberProfile | IdGenerator | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository
    const profile = yield* MemberProfile
    const ids = yield* IdGenerator
    const clock = yield* Clock

    const atelier = yield* repository.findPublishedById(payload.atelierId)
    if (atelier === null) return yield* Effect.fail(new AtelierNotJoinableError({ atelierId: payload.atelierId }))

    const now = yield* clock.now
    const existing = yield* repository.findMembership(auth.userId, atelier.id)
    const membership =
      existing ??
      (yield* repository.insertMembership({
        id: MembershipId.make(yield* ids.uuid),
        userId: auth.userId,
        atelierId: atelier.id,
        role: MembershipRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        joinedAt: now,
      }))

    yield* profile.markOnboarded(auth.userId, payload.practice, now)

    return {
      atelierId: atelier.id,
      atelierSlug: atelier.slug,
      atelierName: atelier.name,
      role: membership.role,
      practice: payload.practice,
      joinedAt: membership.joinedAt,
    }
  })
