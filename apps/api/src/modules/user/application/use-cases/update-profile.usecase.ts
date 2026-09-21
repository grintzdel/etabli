import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { type CurrentUser, toCurrentUser } from '../../domain/entities/user.entity.ts'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.token.ts'
import type { UpdateProfileBody } from '../../presentation/dtos/update-profile.request.dto.ts'

@Injectable()
export class UpdateProfileUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, body: UpdateProfileBody): Promise<CurrentUser> {
    const updated = await this.userRepository.updateProfile(user.id, body, this.clock.now())
    if (updated === null) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Session expirée' })

    return toCurrentUser(updated, user.memberships)
  }
}
