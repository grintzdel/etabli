import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../../infrastructure/database/database.module.ts'
import { CERTIFICATION_REPOSITORY } from '../domain/repositories/certification.repository.token.ts'
import { CertificationRepositoryDrizzlePg } from './repositories/certification.repository.drizzle-pg.ts'

@Module({
  imports: [DatabaseModule],
  providers: [{ provide: CERTIFICATION_REPOSITORY, useClass: CertificationRepositoryDrizzlePg }],
  exports: [CERTIFICATION_REPOSITORY],
})
export class CertificationInfrastructureModule {}
