import { Module } from '@nestjs/common'

import { MachineInfrastructureModule } from '../machine/infrastructure/machine.infrastructure.module.ts'
import { UserInfrastructureModule } from '../user/infrastructure/user.infrastructure.module.ts'
import { CertificationService } from './application/services/certification.service.ts'
import { GrantCertificationUsecase } from './application/use-cases/grant-certification.usecase.ts'
import { ListCertificationQueueUsecase } from './application/use-cases/list-certification-queue.usecase.ts'
import { ListMyCertificationsUsecase } from './application/use-cases/list-my-certifications.usecase.ts'
import { RequestCertificationUsecase } from './application/use-cases/request-certification.usecase.ts'
import { RevokeCertificationUsecase } from './application/use-cases/revoke-certification.usecase.ts'
import { CertificationInfrastructureModule } from './infrastructure/certification.infrastructure.module.ts'
import {
  CertificationController,
  CertificationReviewController,
} from './presentation/controllers/certification.controller.ts'

@Module({
  imports: [CertificationInfrastructureModule, MachineInfrastructureModule, UserInfrastructureModule],
  controllers: [CertificationController, CertificationReviewController],
  providers: [
    CertificationService,
    RequestCertificationUsecase,
    ListMyCertificationsUsecase,
    ListCertificationQueueUsecase,
    GrantCertificationUsecase,
    RevokeCertificationUsecase,
  ],
})
export class CertificationModule {}
