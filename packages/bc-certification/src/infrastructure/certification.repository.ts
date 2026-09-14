import type { RepoError } from '@etabli/shared/errors'
import type { CertificationId, MachineId, UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { CertificationStatus } from '../domain/certification.constants'
import type { Certification } from '../domain/certification.schema'

export interface CertificationRepositoryService {
  readonly findById: (id: CertificationId) => Effect.Effect<Certification | null, RepoError>
  readonly findForUserAndMachine: (
    userId: UserId,
    machineId: MachineId
  ) => Effect.Effect<Certification | null, RepoError>
  readonly listForUser: (userId: UserId) => Effect.Effect<ReadonlyArray<Certification>, RepoError>
  readonly listForMachines: (
    machineIds: ReadonlyArray<MachineId>
  ) => Effect.Effect<ReadonlyArray<Certification>, RepoError>
  readonly insert: (certification: Certification) => Effect.Effect<Certification, RepoError>
  readonly reopen: (
    id: CertificationId,
    at: Certification['requestedAt']
  ) => Effect.Effect<Certification | null, RepoError>
  readonly decide: (
    id: CertificationId,
    status: CertificationStatus,
    decidedBy: UserId,
    at: Certification['requestedAt']
  ) => Effect.Effect<Certification | null, RepoError>
}

export class CertificationRepository extends Context.Tag('@etabli/CertificationRepository')<
  CertificationRepository,
  CertificationRepositoryService
>() {}
