import type { RepoError } from '@etabli/shared/errors'
import type { MachineId, UserId } from '@etabli/shared/schema'
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export interface CertificationCheckerService {
  readonly isCertified: (userId: UserId, machineId: MachineId) => Effect.Effect<boolean, RepoError>
}

export class CertificationChecker extends Context.Tag('@etabli/CertificationChecker')<
  CertificationChecker,
  CertificationCheckerService
>() {}
