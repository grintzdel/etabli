import { AuthContext, isMemberOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import { IdGenerator } from '@etabli/shared/id'
import { CertificationId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { CertificationStatus } from '../../../domain/certification.constants'
import type { Certification, RequestCertification } from '../../../domain/certification.schema'
import { CertificationAlreadyRequestedError, MachineNotCertifiableError } from '../../../domain/errors'
import { CertificationRepository } from '../../../infrastructure/certification.repository'
import { MachineDirectory } from '../../ports/machine-directory'

export const requestCertification = (
  input: RequestCertification
): Effect.Effect<
  Certification,
  CertificationAlreadyRequestedError | MachineNotCertifiableError | RepoError,
  AuthContext | CertificationRepository | MachineDirectory | IdGenerator | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* CertificationRepository
    const machines = yield* MachineDirectory
    const ids = yield* IdGenerator
    const clock = yield* Clock

    const machine = yield* machines.find(input.machineId)
    const reachable =
      machine !== null && !machine.retired && machine.requiresCertification && isMemberOf(auth, machine.atelierId)
    if (!reachable) return yield* Effect.fail(new MachineNotCertifiableError({ machineId: input.machineId }))

    const now = yield* clock.now
    const existing = yield* repository.findForUserAndMachine(auth.userId, input.machineId)

    if (existing === null) {
      return yield* repository.insert({
        id: CertificationId.make(yield* ids.uuid),
        userId: auth.userId,
        machineId: input.machineId,
        status: CertificationStatus.PENDING,
        requestedAt: now,
        decidedAt: null,
        decidedBy: null,
      })
    }

    if (existing.status !== CertificationStatus.REVOKED) {
      return yield* Effect.fail(new CertificationAlreadyRequestedError({ machineId: input.machineId }))
    }

    const reopened = yield* repository.reopen(existing.id, now)
    if (reopened === null) return yield* Effect.fail(new MachineNotCertifiableError({ machineId: input.machineId }))
    return reopened
  })
