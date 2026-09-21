import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../../infrastructure/database/database.module.ts'
import { USER_REPOSITORY } from '../domain/repositories/user.repository.token.ts'
import { UserRepositoryDrizzlePg } from './repositories/user.repository.drizzle-pg.ts'

@Module({
  imports: [DatabaseModule],
  providers: [{ provide: USER_REPOSITORY, useClass: UserRepositoryDrizzlePg }],
  exports: [USER_REPOSITORY],
})
export class UserInfrastructureModule {}
