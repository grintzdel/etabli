import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export interface MemberDirectoryService {
  readonly namesOf: (userIds: ReadonlyArray<UserId>) => Effect.Effect<ReadonlyMap<UserId, string>, RepoError>
}

export class MemberDirectory extends Context.Tag('@etabli/MemberDirectory')<
  MemberDirectory,
  MemberDirectoryService
>() {}
