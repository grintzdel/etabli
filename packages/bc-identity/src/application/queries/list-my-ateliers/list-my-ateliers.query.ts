import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { MemberAtelier } from '../../../domain/member-atelier.schema'
import { MemberAteliers } from '../../ports/member-ateliers'

export const listMyAteliers: Effect.Effect<
  ReadonlyArray<MemberAtelier>,
  RepoError,
  AuthContext | MemberAteliers
> = Effect.gen(function* () {
  const auth = yield* AuthContext
  const ateliers = yield* MemberAteliers

  return yield* ateliers.forUser(auth.userId)
})
