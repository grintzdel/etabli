import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { isFabmanagerOf } from '../../../../shared/domain/permissions.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import type { CertificationStatus } from '../../domain/constants/certification.constant.ts'
import type { CertificationEntity } from '../../domain/entities/certification.entity.ts'
import { CertificationUnknownError } from '../../domain/errors/certification.errors.ts'
import type { ICertificationRepository } from '../../domain/repositories/certification.repository.interface.ts'

export interface DecideDependencies {
  readonly certificationRepository: ICertificationRepository
  readonly machineRepository: IMachineRepository
  readonly clock: IClock
}

export const decideCertification = async (
  deps: DecideDependencies,
  user: AuthUser,
  certificationId: string,
  decision: CertificationStatus
): Promise<CertificationEntity> => {
  const certification = await deps.certificationRepository.findById(certificationId)
  if (certification === null) throw new CertificationUnknownError(certificationId)

  const machine = await deps.machineRepository.findById(certification.machineId)
  if (machine === null || !isFabmanagerOf(user, machine.atelierId)) {
    throw new CertificationUnknownError(certificationId)
  }

  const decided = await deps.certificationRepository.decide(certificationId, decision, user.id, deps.clock.now())
  if (decided === null) throw new CertificationUnknownError(certificationId)
  return decided
}
