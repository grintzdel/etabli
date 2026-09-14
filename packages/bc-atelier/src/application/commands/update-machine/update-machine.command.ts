import { AuthContext, isFabmanagerOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { MachineId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import type { Machine, UpdateMachine } from '../../../domain/atelier.schema'
import { MachineUnknownError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const updateMachine = (
  machineId: MachineId,
  patch: UpdateMachine
): Effect.Effect<Machine, MachineUnknownError | RepoError, AuthContext | AtelierRepository | Clock> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository
    const clock = yield* Clock

    const machine = yield* repository.findMachineById(machineId)
    if (machine === null || !isFabmanagerOf(auth, machine.atelierId)) {
      return yield* Effect.fail(new MachineUnknownError({ machineId }))
    }

    const updated = yield* repository.updateMachine(machineId, patch, yield* clock.now)
    if (updated === null) return yield* Effect.fail(new MachineUnknownError({ machineId }))
    return updated
  })
