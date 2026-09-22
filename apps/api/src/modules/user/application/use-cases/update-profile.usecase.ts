import { ApiErrorCode } from '@etabli/contract'
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
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
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(body: UpdateProfileBody): Promise<CurrentUser> {
    const user = this.authContext.user
    const updated = await this.userRepository.updateProfile(user.id, body, this.clock.now())
    if (updated === null)
      throw new UnauthorizedException({ code: ApiErrorCode.UNAUTHORIZED, message: 'Session expirée' })

    return toCurrentUser(updated, user.memberships)
  }
}
