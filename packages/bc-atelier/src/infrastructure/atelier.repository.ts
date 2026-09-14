import type { RepoError } from '@etabli/shared/errors'
import type { AtelierId, MachineId, UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { AtelierStatus } from '../domain/atelier.constants'
import type {
  AdminAtelier,
  Atelier,
  AtelierSummary,
  ListAteliersParams,
  Machine,
  Membership,
  Slug,
  UpdateMachine,
} from '../domain/atelier.schema'

export interface AtelierRepositoryService {
  readonly listPublished: (params: ListAteliersParams) => Effect.Effect<ReadonlyArray<AtelierSummary>, RepoError>
  readonly findPublishedBySlug: (slug: Slug) => Effect.Effect<Atelier | null, RepoError>
  readonly findPublishedById: (id: AtelierId) => Effect.Effect<Atelier | null, RepoError>
  readonly findMembership: (userId: UserId, atelierId: AtelierId) => Effect.Effect<Membership | null, RepoError>
  readonly listMembershipsForUser: (userId: UserId) => Effect.Effect<ReadonlyArray<Membership>, RepoError>
  readonly listMachines: (atelierId: AtelierId) => Effect.Effect<ReadonlyArray<Machine>, RepoError>
  readonly listAll: () => Effect.Effect<ReadonlyArray<AdminAtelier>, RepoError>
  readonly findAnyById: (id: AtelierId) => Effect.Effect<Atelier | null, RepoError>
  readonly findAnyBySlug: (slug: Slug) => Effect.Effect<Atelier | null, RepoError>
  readonly updateStatus: (
    id: AtelierId,
    status: AtelierStatus,
    at: Atelier['updatedAt']
  ) => Effect.Effect<Atelier | null, RepoError>
  readonly insertAtelier: (atelier: Atelier) => Effect.Effect<Atelier, RepoError>
  readonly findMachineById: (id: MachineId) => Effect.Effect<Machine | null, RepoError>
  readonly updateMachine: (
    id: MachineId,
    patch: UpdateMachine,
    at: Machine['updatedAt']
  ) => Effect.Effect<Machine | null, RepoError>
  readonly insertMachine: (machine: Machine) => Effect.Effect<Machine, RepoError>
  readonly insertMembership: (membership: Membership) => Effect.Effect<Membership, RepoError>
}

export class AtelierRepository extends Context.Tag('@etabli/AtelierRepository')<
  AtelierRepository,
  AtelierRepositoryService
>() {}
