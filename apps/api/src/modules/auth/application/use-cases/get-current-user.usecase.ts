import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { type CurrentUser, toCurrentUser } from '../../../user/domain/entities/user.entity.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import { SessionExpiredError } from '../../domain/errors/auth.errors.ts'

@Injectable()
export class GetCurrentUserUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(auth: AuthUser): Promise<CurrentUser> {
    const user = await this.userRepository.findById(auth.id)
    if (user === null) throw new SessionExpiredError('account no longer exists')

    return toCurrentUser(user, auth.memberships)
  }
}
