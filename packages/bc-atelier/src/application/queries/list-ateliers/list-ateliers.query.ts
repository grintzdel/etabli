import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { AtelierSummary, ListAteliersParams } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const listAteliers = (
  params: ListAteliersParams
): Effect.Effect<ReadonlyArray<AtelierSummary>, RepoError, AtelierRepository> =>
  Effect.flatMap(AtelierRepository, (repository) => repository.listPublished(params))
