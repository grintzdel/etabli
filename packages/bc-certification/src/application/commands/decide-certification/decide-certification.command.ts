import { AuthContext, isFabmanagerOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { CertificationId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { CertificationStatus } from '../../../domain/certification.constants'
import type { Certification } from '../../../domain/certification.schema'
import { CertificationUnknownError } from '../../../domain/errors'
import { CertificationRepository } from '../../../infrastructure/certification.repository'
import { MachineDirectory } from '../../ports/machine-directory'

type Decision = typeof CertificationStatus.GRANTED | typeof CertificationStatus.REVOKED

const decide = (
  certificationId: CertificationId,
  decision: Decision
): Effect.Effect<
  Certification,
  CertificationUnknownError | RepoError,
  AuthContext | CertificationRepository | MachineDirectory | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* CertificationRepository
    const machines = yield* MachineDirectory
    const clock = yield* Clock

    const unknown = new CertificationUnknownError({ certificationId })

    const certification = yield* repository.findById(certificationId)
    if (certification === null) return yield* Effect.fail(unknown)

    const machine = yield* machines.find(certification.machineId)
    if (machine === null || !isFabmanagerOf(auth, machine.atelierId)) return yield* Effect.fail(unknown)

    const decided = yield* repository.decide(certificationId, decision, auth.userId, yield* clock.now)
    if (decided === null) return yield* Effect.fail(unknown)
    return decided
  })

export const grantCertification = (certificationId: CertificationId) =>
  decide(certificationId, CertificationStatus.GRANTED)

export const revokeCertification = (certificationId: CertificationId) =>
  decide(certificationId, CertificationStatus.REVOKED)
