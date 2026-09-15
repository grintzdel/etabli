import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export interface MemberRosterService {
  readonly namesOf: (userIds: ReadonlyArray<UserId>) => Effect.Effect<ReadonlyMap<UserId, string>, RepoError>
}

export class MemberRoster extends Context.Tag('@etabli/MemberRoster')<MemberRoster, MemberRosterService>() {}
