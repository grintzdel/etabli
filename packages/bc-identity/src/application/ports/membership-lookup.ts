import type { AuthMembership } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export interface MembershipLookupService {
  readonly forUser: (userId: UserId) => Effect.Effect<ReadonlyArray<AuthMembership>, RepoError>
}

export class MembershipLookup extends Context.Tag('@etabli/MembershipLookup')<
  MembershipLookup,
  MembershipLookupService
>() {}
