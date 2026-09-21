import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isMemberOf } from '../../../../shared/domain/permissions.ts'
import type { UserPreferencesEntity } from '../../domain/entities/user.entity.ts'
import { PreferredAtelierNotJoinedError } from '../../domain/errors/user.errors.ts'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.token.ts'
import type { UpdatePreferencesBody } from '../../presentation/dtos/update-preferences.request.dto.ts'

@Injectable()
export class UpdatePreferencesUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, body: UpdatePreferencesBody): Promise<UserPreferencesEntity> {
    const wanted = body.defaultAtelierId
    if (wanted != null && !isMemberOf(user, wanted)) throw new PreferredAtelierNotJoinedError(wanted)

    return this.userRepository.upsertPreferences(user.id, body, this.clock.now())
  }
}
