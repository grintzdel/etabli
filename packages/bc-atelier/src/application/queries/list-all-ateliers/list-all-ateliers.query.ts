import { AuthContext, isPlatformAdmin } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { AdminAtelier } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const listAllAteliers = (): Effect.Effect<
  ReadonlyArray<AdminAtelier>,
  ForbiddenError | RepoError,
  AuthContext | AtelierRepository
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin sees every atelier' }))
    }

    return yield* repository.listAll()
  })
