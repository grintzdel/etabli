import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IMembershipRepository } from '../../../membership/domain/repositories/membership.repository.interface.ts'
import { MEMBERSHIP_REPOSITORY } from '../../../membership/domain/repositories/membership.repository.token.ts'
import { UserStatus } from '../../../user/domain/constants/user.constant.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import { AccountSuspendedError, SessionExpiredError } from '../../domain/errors/auth.errors.ts'
import type { IAuthContextLoader } from '../../domain/services/auth-context-loader.interface.ts'
import type { ITokenIssuer } from '../../domain/services/token-issuer.interface.ts'
import { TOKEN_ISSUER } from '../../domain/services/token-issuer.token.ts'

@Injectable()
export class AuthContextLoader implements IAuthContextLoader {
  constructor(
    @Inject(TOKEN_ISSUER) private readonly tokens: ITokenIssuer,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: IMembershipRepository
  ) {}

  async fromBearerToken(token: string): Promise<AuthUser> {
    const claims = await this.tokens.verify(token)

    const user = await this.userRepository.findById(claims.userId)
    if (user === null) throw new SessionExpiredError('account no longer exists')
    if (user.status === UserStatus.SUSPENDED) throw new AccountSuspendedError()

    return {
      id: user.id,
      platformRole: user.platformRole,
      memberships: await this.membershipRepository.listAuthMemberships(user.id),
    }
  }
}
