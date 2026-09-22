import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UserStatus } from '../../domain/constants/user.constant.ts'
import type { AdminUserEntity } from '../../domain/entities/user.entity.ts'
import { AdminSelfLockoutError, UserUnknownError } from '../../domain/errors/user.errors.ts'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.token.ts'
import type { UpdateAdminUserBody } from '../../presentation/dtos/update-admin-user.request.dto.ts'

const locksItselfOut = (patch: UpdateAdminUserBody): boolean =>
  patch.platformRole === PlatformRole.MEMBER || patch.status === UserStatus.SUSPENDED

@Injectable()
export class UpdateAdminUserUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(userId: string, patch: UpdateAdminUserBody): Promise<AdminUserEntity> {
    const user = this.authContext.user
    if (user.id === userId && locksItselfOut(patch)) throw new AdminSelfLockoutError()

    const updated = await this.userRepository.updateAdminState(userId, patch, this.clock.now())
    if (updated === null) throw new UserUnknownError(userId)

    const admin = await this.userRepository.findAdminById(updated.id)
    if (admin === null) throw new UserUnknownError(userId)
    return admin
  }
}
