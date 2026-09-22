import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import { DEFAULT_THEME } from '../../domain/constants/preferences.constant.ts'
import type { UserPreferencesEntity } from '../../domain/entities/user.entity.ts'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.token.ts'

@Injectable()
export class GetPreferencesUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(): Promise<UserPreferencesEntity> {
    const user = this.authContext.user
    const stored = await this.userRepository.findPreferences(user.id)
    return stored ?? { userId: user.id, theme: DEFAULT_THEME, defaultAtelierId: null, updatedAt: null }
  }
}
