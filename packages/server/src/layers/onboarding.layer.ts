import { AtelierRepository, MemberProfile } from '@etabli/bc-atelier'
import { MembershipLookup, UserRepository } from '@etabli/bc-identity'
import { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export const MembershipLookupLive = Layer.effect(
  MembershipLookup,
  Effect.map(AtelierRepository, (repository) =>
    MembershipLookup.of({
      forUser: (userId) =>
        Effect.map(repository.listMembershipsForUser(userId), (memberships) =>
          memberships.map((membership) => ({ atelierId: membership.atelierId, role: membership.role }))
        ),
    })
  )
)

export const MemberProfileLive = Layer.effect(
  MemberProfile,
  Effect.map(UserRepository, (repository) =>
    MemberProfile.of({
      markOnboarded: (userId, practice, at) =>
        Effect.flatMap(repository.markOnboarded(userId, practice, at), (user) =>
          user === null
            ? Effect.fail(new RepoError({ cause: 'account no longer exists', operation: 'users.markOnboarded' }))
            : Effect.void
        ),
    })
  )
)
