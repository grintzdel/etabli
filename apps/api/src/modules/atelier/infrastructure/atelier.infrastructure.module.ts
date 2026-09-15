import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../../infrastructure/database/database.module.ts'
import { ATELIER_REPOSITORY } from '../domain/repositories/atelier.repository.token.ts'
import { AtelierRepositoryDrizzlePg } from './repositories/atelier.repository.drizzle-pg.ts'

@Module({
  imports: [DatabaseModule],
  providers: [{ provide: ATELIER_REPOSITORY, useClass: AtelierRepositoryDrizzlePg }],
  exports: [ATELIER_REPOSITORY],
})
export class AtelierInfrastructureModule {}
