import { AuthContext, isPlatformAdmin } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { ForbiddenError } from '@etabli/shared/errors'
import type { AtelierId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { MachineStatus } from '../../../domain/atelier.constants'
import type { AdminAtelier, SetAtelierStatus } from '../../../domain/atelier.schema'
import { toAdminAtelier } from '../../../domain/atelier.schema'
import { AtelierUnknownError } from '../../../domain/errors'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const setAtelierStatus = (
  atelierId: AtelierId,
  input: SetAtelierStatus
): Effect.Effect<
  AdminAtelier,
  AtelierUnknownError | ForbiddenError | RepoError,
  AuthContext | AtelierRepository | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository
    const clock = yield* Clock

    if (!isPlatformAdmin(auth)) {
      return yield* Effect.fail(new ForbiddenError({ reason: 'only a platform admin publishes an atelier' }))
    }

    const now = yield* clock.now
    const atelier = yield* repository.updateStatus(atelierId, input.status, now)
    if (atelier === null) return yield* Effect.fail(new AtelierUnknownError({ atelierId }))

    const machines = yield* repository.listMachines(atelier.id)
    return toAdminAtelier(atelier, machines.filter((machine) => machine.status !== MachineStatus.RETIRED).length)
  })
