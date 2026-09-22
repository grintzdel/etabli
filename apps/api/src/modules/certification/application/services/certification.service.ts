import { Injectable } from '@nestjs/common'

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

  public async request(body: RequestCertificationBody): Promise<CertificationEntity> {
    return this.requestCertificationUsecase.execute(body)
  }

  public async mine(): Promise<ReadonlyArray<MyCertification>> {
    return this.listMyCertificationsUsecase.execute()
  }

  public async queue(): Promise<ReadonlyArray<CertificationRequest>> {
    return this.listCertificationQueueUsecase.execute()
  }

  public async grant(certificationId: string): Promise<CertificationEntity> {
    return this.grantCertificationUsecase.execute(certificationId)
  }

  public async revoke(certificationId: string): Promise<CertificationEntity> {
    return this.revokeCertificationUsecase.execute(certificationId)
  }
}
