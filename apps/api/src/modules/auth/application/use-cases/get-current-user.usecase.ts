import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import { type CurrentUser, toCurrentUser } from '../../../user/domain/entities/user.entity.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import { SessionExpiredError } from '../../domain/errors/auth.errors.ts'

@Injectable()
export class GetCurrentUserUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(): Promise<CurrentUser> {
    const auth = this.authContext.user
    const user = await this.userRepository.findById(auth.id)
    if (user === null) throw new SessionExpiredError('account no longer exists')

    return toCurrentUser(user, auth.memberships)
  }
}
