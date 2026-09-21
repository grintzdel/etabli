import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isMemberOf } from '../../../../shared/domain/permissions.ts'
import { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { CertificationStatus } from '../../domain/constants/certification.constant.ts'
import type { CertificationEntity } from '../../domain/entities/certification.entity.ts'
import {
  CertificationAlreadyRequestedError,
  MachineNotCertifiableError,
} from '../../domain/errors/certification.errors.ts'
import type { ICertificationRepository } from '../../domain/repositories/certification.repository.interface.ts'
import { CERTIFICATION_REPOSITORY } from '../../domain/repositories/certification.repository.token.ts'
import type { RequestCertificationBody } from '../../presentation/dtos/request-certification.request.dto.ts'

@Injectable()
export class RequestCertificationUsecase {
  constructor(
    @Inject(CERTIFICATION_REPOSITORY) private readonly certificationRepository: ICertificationRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, body: RequestCertificationBody): Promise<CertificationEntity> {
    const machine = await this.machineRepository.findById(body.machineId)
    const reachable =
      machine !== null &&
      machine.status !== MachineStatus.RETIRED &&
      machine.requiresCertification &&
      isMemberOf(user, machine.atelierId)
    if (!reachable) throw new MachineNotCertifiableError(body.machineId)

    const now = this.clock.now()
    const existing = await this.certificationRepository.findForUserAndMachine(user.id, body.machineId)

    if (existing === null) {
      return this.certificationRepository.insert({
        id: randomUUID(),
        userId: user.id,
        machineId: body.machineId,
        status: CertificationStatus.PENDING,
        requestedAt: now,
      })
    }

    if (existing.status !== CertificationStatus.REVOKED) {
      throw new CertificationAlreadyRequestedError(body.machineId)
    }

    const reopened = await this.certificationRepository.reopen(existing.id, now)
    if (reopened === null) throw new MachineNotCertifiableError(body.machineId)
    return reopened
  }
}
