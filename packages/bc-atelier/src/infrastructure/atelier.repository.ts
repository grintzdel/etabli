import type { RepoError } from '@etabli/shared/errors'
import type { AtelierId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { Atelier, AtelierSummary, ListAteliersParams, Machine, Membership, Slug } from '../domain/atelier.schema'

export interface AtelierRepositoryService {
  readonly listPublished: (params: ListAteliersParams) => Effect.Effect<ReadonlyArray<AtelierSummary>, RepoError>
  readonly findPublishedBySlug: (slug: Slug) => Effect.Effect<Atelier | null, RepoError>
  readonly listMachines: (atelierId: AtelierId) => Effect.Effect<ReadonlyArray<Machine>, RepoError>
  readonly insertAtelier: (atelier: Atelier) => Effect.Effect<Atelier, RepoError>
  readonly insertMachine: (machine: Machine) => Effect.Effect<Machine, RepoError>
  readonly insertMembership: (membership: Membership) => Effect.Effect<Membership, RepoError>
}

export class AtelierRepository extends Context.Tag('@etabli/AtelierRepository')<
  AtelierRepository,
  AtelierRepositoryService
>() {}
