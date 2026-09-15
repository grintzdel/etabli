import { Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type {
  CertificationEntity,
  CertificationRequest,
  MyCertification,
} from '../../domain/entities/certification.entity.ts'
import type { RequestCertificationBody } from '../../presentation/dtos/request-certification.request.dto.ts'
import { GrantCertificationUsecase } from '../use-cases/grant-certification.usecase.ts'
import { ListCertificationQueueUsecase } from '../use-cases/list-certification-queue.usecase.ts'
import { ListMyCertificationsUsecase } from '../use-cases/list-my-certifications.usecase.ts'
import { RequestCertificationUsecase } from '../use-cases/request-certification.usecase.ts'
import { RevokeCertificationUsecase } from '../use-cases/revoke-certification.usecase.ts'

@Injectable()
export class CertificationService {
  constructor(
    private readonly requestCertificationUsecase: RequestCertificationUsecase,
    private readonly listMyCertificationsUsecase: ListMyCertificationsUsecase,
    private readonly listCertificationQueueUsecase: ListCertificationQueueUsecase,
    private readonly grantCertificationUsecase: GrantCertificationUsecase,
    private readonly revokeCertificationUsecase: RevokeCertificationUsecase
  ) {}

  public async request(user: AuthUser, body: RequestCertificationBody): Promise<CertificationEntity> {
    return this.requestCertificationUsecase.execute(user, body)
  }

  public async mine(user: AuthUser): Promise<ReadonlyArray<MyCertification>> {
    return this.listMyCertificationsUsecase.execute(user)
  }

  public async queue(user: AuthUser): Promise<ReadonlyArray<CertificationRequest>> {
    return this.listCertificationQueueUsecase.execute(user)
  }

  public async grant(user: AuthUser, certificationId: string): Promise<CertificationEntity> {
    return this.grantCertificationUsecase.execute(user, certificationId)
  }

  public async revoke(user: AuthUser, certificationId: string): Promise<CertificationEntity> {
    return this.revokeCertificationUsecase.execute(user, certificationId)
  }
}
