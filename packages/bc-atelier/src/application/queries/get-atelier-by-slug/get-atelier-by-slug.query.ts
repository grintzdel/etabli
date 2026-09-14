import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { AtelierDetail, Slug } from '../../../domain/atelier.schema'
import { toAtelierDetail } from '../../../domain/atelier.schema'
import { AtelierNotFoundError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const getAtelierBySlug = (
  slug: Slug
): Effect.Effect<AtelierDetail, AtelierNotFoundError | RepoError, AtelierRepository> =>
  Effect.gen(function* () {
    const repository = yield* AtelierRepository

    const atelier = yield* repository.findPublishedBySlug(slug)
    if (atelier === null) return yield* Effect.fail(new AtelierNotFoundError({ slug }))

    return toAtelierDetail(atelier, yield* repository.listMachines(atelier.id))
  })
