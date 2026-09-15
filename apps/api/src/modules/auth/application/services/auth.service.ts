import { Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { CurrentUser } from '../../../user/domain/entities/user.entity.ts'
import type { Session } from '../../domain/entities/session.entity.ts'
import type { ChangePasswordBody } from '../../presentation/dtos/change-password.request.dto.ts'
import type { LoginBody } from '../../presentation/dtos/login.request.dto.ts'
import type { RegisterBody } from '../../presentation/dtos/register.request.dto.ts'
import { ChangePasswordUsecase } from '../use-cases/change-password.usecase.ts'
import { GetCurrentUserUsecase } from '../use-cases/get-current-user.usecase.ts'
import { LoginUserUsecase } from '../use-cases/login-user.usecase.ts'
import { RegisterUserUsecase } from '../use-cases/register-user.usecase.ts'

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUserUsecase: RegisterUserUsecase,
    private readonly loginUserUsecase: LoginUserUsecase,
    private readonly changePasswordUsecase: ChangePasswordUsecase,
    private readonly getCurrentUserUsecase: GetCurrentUserUsecase
  ) {}

  public async register(body: RegisterBody): Promise<Session> {
    return this.registerUserUsecase.execute(body)
  }

  public async login(body: LoginBody): Promise<Session> {
    return this.loginUserUsecase.execute(body)
  }

  public async changePassword(user: AuthUser, body: ChangePasswordBody): Promise<Session> {
    return this.changePasswordUsecase.execute(user, body)
  }

  public async me(user: AuthUser): Promise<CurrentUser> {
    return this.getCurrentUserUsecase.execute(user)
  }
}
