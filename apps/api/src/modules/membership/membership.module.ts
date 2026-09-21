import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../infrastructure/database/database.module.ts'
import { AtelierInfrastructureModule } from '../atelier/infrastructure/atelier.infrastructure.module.ts'
import { UserInfrastructureModule } from '../user/infrastructure/user.infrastructure.module.ts'
import { MembershipService } from './application/services/membership.service.ts'
import { CompleteOnboardingUsecase } from './application/use-cases/complete-onboarding.usecase.ts'
import { ListMyAteliersUsecase } from './application/use-cases/list-my-ateliers.usecase.ts'
import { SetMembershipRoleUsecase } from './application/use-cases/set-membership-role.usecase.ts'
import { MembershipInfrastructureModule } from './infrastructure/membership.infrastructure.module.ts'
import {
  AdminMembershipController,
  MyAteliersController,
  OnboardingController,
} from './presentation/controllers/membership.controller.ts'

@Module({
  imports: [DatabaseModule, MembershipInfrastructureModule, AtelierInfrastructureModule, UserInfrastructureModule],
  controllers: [OnboardingController, MyAteliersController, AdminMembershipController],
  providers: [MembershipService, CompleteOnboardingUsecase, ListMyAteliersUsecase, SetMembershipRoleUsecase],
})
export class MembershipModule {}
