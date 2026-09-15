import { AuthContext, isFabmanagerOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import { IdGenerator } from '@etabli/shared/id'
import { MachineId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { MachineStatus } from '../../../domain/atelier.constants'
import type { CreateMachine, Machine } from '../../../domain/atelier.schema'
import { MachineNfcTagTakenError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const createMachine = (
  input: CreateMachine
): Effect.Effect<
  Machine,
  ForbiddenError | MachineNfcTagTakenError | RepoError,
  AuthContext | AtelierRepository | IdGenerator | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository
    const ids = yield* IdGenerator
    const clock = yield* Clock

    if (!isFabmanagerOf(auth, input.atelierId)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a fabmanager of this atelier adds a machine' }))
    }

    if (input.nfcTagId !== null) {
      const wearer = yield* repository.findMachineByNfcTag(input.nfcTagId)
      if (wearer !== null) return yield* Effect.fail(new MachineNfcTagTakenError({ nfcTagId: input.nfcTagId }))
    }

    const now = yield* clock.now
    return yield* repository.insertMachine({
      ...input,
      id: MachineId.make(yield* ids.uuid),
      status: MachineStatus.AVAILABLE,
      createdAt: now,
      updatedAt: now,
    })
  })
