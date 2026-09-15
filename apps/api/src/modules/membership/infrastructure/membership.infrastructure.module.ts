import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../../infrastructure/database/database.module.ts'
import { MEMBERSHIP_REPOSITORY } from '../domain/repositories/membership.repository.token.ts'
import { MembershipRepositoryDrizzlePg } from './repositories/membership.repository.drizzle-pg.ts'

@Module({
  imports: [DatabaseModule],
  providers: [{ provide: MEMBERSHIP_REPOSITORY, useClass: MembershipRepositoryDrizzlePg }],
  exports: [MEMBERSHIP_REPOSITORY],
})
export class MembershipInfrastructureModule {}
