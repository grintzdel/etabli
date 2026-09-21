import { Global, Module } from '@nestjs/common'

import { MembershipInfrastructureModule } from '../membership/infrastructure/membership.infrastructure.module.ts'
import { UserInfrastructureModule } from '../user/infrastructure/user.infrastructure.module.ts'
import { AuthContextLoader } from './application/services/auth-context.loader.ts'
import { AuthService } from './application/services/auth.service.ts'
import { ChangePasswordUsecase } from './application/use-cases/change-password.usecase.ts'
import { GetCurrentUserUsecase } from './application/use-cases/get-current-user.usecase.ts'
import { LoginUserUsecase } from './application/use-cases/login-user.usecase.ts'
import { RegisterUserUsecase } from './application/use-cases/register-user.usecase.ts'
import { AUTH_CONTEXT_LOADER } from './domain/services/auth-context-loader.token.ts'
import { AuthInfrastructureModule } from './infrastructure/auth.infrastructure.module.ts'
import { AuthController } from './presentation/controllers/auth.controller.ts'
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard.ts'
import { RolesGuard } from './presentation/guards/roles.guard.ts'

@Global()
@Module({
  imports: [AuthInfrastructureModule, UserInfrastructureModule, MembershipInfrastructureModule],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_CONTEXT_LOADER, useClass: AuthContextLoader },
    AuthService,
    RegisterUserUsecase,
    LoginUserUsecase,
    ChangePasswordUsecase,
    GetCurrentUserUsecase,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AUTH_CONTEXT_LOADER, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
