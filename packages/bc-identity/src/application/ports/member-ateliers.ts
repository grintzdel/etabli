import type { RepoError } from '@etabli/shared/errors'
import type { UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { MemberAtelier } from '../../domain/member-atelier.schema'

export interface MemberAteliersService {
  readonly forUser: (userId: UserId) => Effect.Effect<ReadonlyArray<MemberAtelier>, RepoError>
}

export class MemberAteliers extends Context.Tag('@etabli/MemberAteliers')<MemberAteliers, MemberAteliersService>() {}
