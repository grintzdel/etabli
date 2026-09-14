import type { RepoError } from '@etabli/shared/errors'
import type { AtelierId, MachineId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export interface CertifiableMachine {
  readonly machineId: MachineId
  readonly machineName: string
  readonly atelierId: AtelierId
  readonly atelierName: string
  readonly atelierSlug: string
  readonly requiresCertification: boolean
  readonly retired: boolean
}

export interface MachineDirectoryService {
  readonly find: (machineId: MachineId) => Effect.Effect<CertifiableMachine | null, RepoError>
  readonly findMany: (
    machineIds: ReadonlyArray<MachineId>
  ) => Effect.Effect<ReadonlyArray<CertifiableMachine>, RepoError>
  readonly listForAteliers: (
    atelierIds: ReadonlyArray<AtelierId>
  ) => Effect.Effect<ReadonlyArray<CertifiableMachine>, RepoError>
}

export class MachineDirectory extends Context.Tag('@etabli/MachineDirectory')<
  MachineDirectory,
  MachineDirectoryService
>() {}
