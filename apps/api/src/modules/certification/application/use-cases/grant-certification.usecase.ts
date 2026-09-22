import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { CertificationStatus } from '../../domain/constants/certification.constant.ts'
import type { CertificationEntity } from '../../domain/entities/certification.entity.ts'
import type { ICertificationRepository } from '../../domain/repositories/certification.repository.interface.ts'
import { CERTIFICATION_REPOSITORY } from '../../domain/repositories/certification.repository.token.ts'
import { decideCertification } from './decide-certification.ts'

@Injectable()
export class GrantCertificationUsecase {
  constructor(
    @Inject(CERTIFICATION_REPOSITORY) private readonly certificationRepository: ICertificationRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(certificationId: string): Promise<CertificationEntity> {
    const user = this.authContext.user
    return decideCertification(
      {
        certificationRepository: this.certificationRepository,
        machineRepository: this.machineRepository,
        clock: this.clock,
      },
      user,
      certificationId,
      CertificationStatus.GRANTED
    )
  }
}
