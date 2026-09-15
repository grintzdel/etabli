import type { RepoError } from '@etabli/shared/errors'
import type { AtelierId, MachineId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { BookableMachineStatus } from '../../domain/booking.constants'

export interface BookableMachine {
  readonly machineId: MachineId
  readonly machineName: string
  readonly atelierId: AtelierId
  readonly atelierName: string
  readonly atelierSlug: string
  readonly status: BookableMachineStatus
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly nfcTagId: string | null
}

export interface MachineCatalogService {
  readonly find: (machineId: MachineId) => Effect.Effect<BookableMachine | null, RepoError>
  readonly findMany: (machineIds: ReadonlyArray<MachineId>) => Effect.Effect<ReadonlyArray<BookableMachine>, RepoError>
  readonly listForAteliers: (
    atelierIds: ReadonlyArray<AtelierId>
  ) => Effect.Effect<ReadonlyArray<BookableMachine>, RepoError>
  readonly listAll: () => Effect.Effect<ReadonlyArray<BookableMachine>, RepoError>
}

export class MachineCatalog extends Context.Tag('@etabli/MachineCatalog')<MachineCatalog, MachineCatalogService>() {}
