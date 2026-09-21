import type { RepoError } from '@etabli/shared/errors'
import type { MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { MachineStatus } from '../../../domain/atelier.constants'
import type { MachineDetail } from '../../../domain/atelier.schema'
import { toMachineDetail } from '../../../domain/atelier.schema'
import { MachineUnknownError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const getMachineDetail = (
  machineId: MachineId
): Effect.Effect<MachineDetail, MachineUnknownError | RepoError, AtelierRepository> =>
  Effect.gen(function* () {
    const repository = yield* AtelierRepository

    const machine = yield* repository.findMachineById(machineId)
    if (machine === null || machine.status === MachineStatus.RETIRED)
      return yield* Effect.fail(new MachineUnknownError({ machineId }))

    const atelier = yield* repository.findPublishedById(machine.atelierId)
    if (atelier === null) return yield* Effect.fail(new MachineUnknownError({ machineId }))

    return toMachineDetail(machine, atelier)
  })
