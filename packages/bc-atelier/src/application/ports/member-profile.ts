import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as DateTime from 'effect/DateTime'
import type * as Effect from 'effect/Effect'

export interface MemberProfileService {
  readonly markOnboarded: (
    userId: UserId,
    practice: ReadonlyArray<string>,
    at: DateTime.Utc
  ) => Effect.Effect<void, RepoError>
}

export class MemberProfile extends Context.Tag('@etabli/MemberProfile')<MemberProfile, MemberProfileService>() {}
