import { Module } from '@nestjs/common'

import { AtelierService } from './application/services/atelier.service.ts'
import { CreateAtelierUsecase } from './application/use-cases/create-atelier.usecase.ts'
import { GetAtelierBySlugUsecase } from './application/use-cases/get-atelier-by-slug.usecase.ts'
import { ListAllAteliersUsecase } from './application/use-cases/list-all-ateliers.usecase.ts'
import { ListAteliersUsecase } from './application/use-cases/list-ateliers.usecase.ts'
import { SetAtelierStatusUsecase } from './application/use-cases/set-atelier-status.usecase.ts'
import { AtelierInfrastructureModule } from './infrastructure/atelier.infrastructure.module.ts'
import { AdminAtelierController } from './presentation/controllers/admin-atelier.controller.ts'
import { AtelierController } from './presentation/controllers/atelier.controller.ts'

@Module({
  imports: [AtelierInfrastructureModule],
  controllers: [AtelierController, AdminAtelierController],
  providers: [
    AtelierService,
    ListAteliersUsecase,
    GetAtelierBySlugUsecase,
    ListAllAteliersUsecase,
    CreateAtelierUsecase,
    SetAtelierStatusUsecase,
  ],
})
export class AtelierModule {}
