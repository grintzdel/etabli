import { Module } from '@nestjs/common'

import { AtelierInfrastructureModule } from '../atelier/infrastructure/atelier.infrastructure.module.ts'
import { MachineService } from './application/services/machine.service.ts'
import { CreateMachineUsecase } from './application/use-cases/create-machine.usecase.ts'
import { GetMachineDetailUsecase } from './application/use-cases/get-machine-detail.usecase.ts'
import { ListManagedParcsUsecase } from './application/use-cases/list-managed-parcs.usecase.ts'
import { UpdateMachineUsecase } from './application/use-cases/update-machine.usecase.ts'
import { MachineInfrastructureModule } from './infrastructure/machine.infrastructure.module.ts'
import { MachineController } from './presentation/controllers/machine.controller.ts'
import { PublicMachineController } from './presentation/controllers/public-machine.controller.ts'

@Module({
  imports: [MachineInfrastructureModule, AtelierInfrastructureModule],
  controllers: [MachineController, PublicMachineController],
  providers: [
    MachineService,
    ListManagedParcsUsecase,
    CreateMachineUsecase,
    UpdateMachineUsecase,
    GetMachineDetailUsecase,
  ],
})
export class MachineModule {}
