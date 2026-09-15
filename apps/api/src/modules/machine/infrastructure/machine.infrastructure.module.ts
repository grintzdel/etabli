import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../../infrastructure/database/database.module.ts'
import { MACHINE_REPOSITORY } from '../domain/repositories/machine.repository.token.ts'
import { MachineRepositoryDrizzlePg } from './repositories/machine.repository.drizzle-pg.ts'

@Module({
  imports: [DatabaseModule],
  providers: [{ provide: MACHINE_REPOSITORY, useClass: MachineRepositoryDrizzlePg }],
  exports: [MACHINE_REPOSITORY],
})
export class MachineInfrastructureModule {}
