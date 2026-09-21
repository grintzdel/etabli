import { Inject, Injectable } from '@nestjs/common'

import type { IMembershipRepository } from '../../../membership/domain/repositories/membership.repository.interface.ts'
import { MEMBERSHIP_REPOSITORY } from '../../../membership/domain/repositories/membership.repository.token.ts'
import { UserStatus } from '../../../user/domain/constants/user.constant.ts'
import { toCurrentUser } from '../../../user/domain/entities/user.entity.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import type { Session } from '../../domain/entities/session.entity.ts'
import { AccountSuspendedError, InvalidCredentialsError } from '../../domain/errors/auth.errors.ts'
import type { IPasswordHasher } from '../../domain/services/password-hasher.interface.ts'
import { PASSWORD_HASHER } from '../../domain/services/password-hasher.token.ts'
import type { ITokenIssuer } from '../../domain/services/token-issuer.interface.ts'
import { TOKEN_ISSUER } from '../../domain/services/token-issuer.token.ts'
import type { LoginBody } from '../../presentation/dtos/login.request.dto.ts'

@Injectable()
export class LoginUserUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: IMembershipRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: ITokenIssuer
  ) {}

  async execute(body: LoginBody): Promise<Session> {
    const user = await this.userRepository.findByEmail(body.email)

    if (user === null) {
      await this.hasher.hash(body.password)
      throw new InvalidCredentialsError()
    }

    if (!(await this.hasher.verify(body.password, user.passwordHash))) throw new InvalidCredentialsError()
    if (user.status === UserStatus.SUSPENDED) throw new AccountSuspendedError()

    const issued = await this.tokens.issue(user.id)
    const memberships = await this.membershipRepository.listAuthMemberships(user.id)
    return { token: issued.token, expiresAt: issued.expiresAt, user: toCurrentUser(user, memberships) }
  }
}
