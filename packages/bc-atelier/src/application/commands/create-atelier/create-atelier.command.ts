import { AuthContext, isPlatformAdmin } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import { IdGenerator } from '@etabli/shared/id'
import { AtelierId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { AtelierStatus } from '../../../domain/atelier.constants'
import type { AdminAtelier, CreateAtelier } from '../../../domain/atelier.schema'
import { toAdminAtelier } from '../../../domain/atelier.schema'
import { AtelierSlugTakenError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const createAtelier = (
  input: CreateAtelier
): Effect.Effect<
  AdminAtelier,
  AtelierSlugTakenError | ForbiddenError | RepoError,
  AuthContext | AtelierRepository | IdGenerator | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository
    const ids = yield* IdGenerator
    const clock = yield* Clock

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin opens an atelier' }))
    }

    const taken = yield* repository.findAnyBySlug(input.slug)
    if (taken !== null) return yield* Effect.fail(new AtelierSlugTakenError({ slug: input.slug }))

    const now = yield* clock.now
    const atelier = yield* repository.insertAtelier({
      ...input,
      id: AtelierId.make(yield* ids.uuid),
      status: AtelierStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    })

    return toAdminAtelier(atelier, 0)
  })
