import { Module } from '@nestjs/common'

import { UserService } from './application/services/user.service.ts'
import { GetPreferencesUsecase } from './application/use-cases/get-preferences.usecase.ts'
import { ListAdminUsersUsecase } from './application/use-cases/list-admin-users.usecase.ts'
import { UpdateAdminUserUsecase } from './application/use-cases/update-admin-user.usecase.ts'
import { UpdatePreferencesUsecase } from './application/use-cases/update-preferences.usecase.ts'
import { UpdateProfileUsecase } from './application/use-cases/update-profile.usecase.ts'
import { UserInfrastructureModule } from './infrastructure/user.infrastructure.module.ts'
import { AdminUserController } from './presentation/controllers/admin-user.controller.ts'
import { UserController } from './presentation/controllers/user.controller.ts'

@Module({
  imports: [UserInfrastructureModule],
  controllers: [UserController, AdminUserController],
  providers: [
    UserService,
    UpdateProfileUsecase,
    GetPreferencesUsecase,
    UpdatePreferencesUsecase,
    ListAdminUsersUsecase,
    UpdateAdminUserUsecase,
  ],
})
export class UserModule {}
