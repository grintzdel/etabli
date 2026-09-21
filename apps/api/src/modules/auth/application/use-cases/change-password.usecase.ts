import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { toCurrentUser } from '../../../user/domain/entities/user.entity.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import type { Session } from '../../domain/entities/session.entity.ts'
import { InvalidCredentialsError, SessionExpiredError } from '../../domain/errors/auth.errors.ts'
import type { IPasswordHasher } from '../../domain/services/password-hasher.interface.ts'
import { PASSWORD_HASHER } from '../../domain/services/password-hasher.token.ts'
import type { ITokenIssuer } from '../../domain/services/token-issuer.interface.ts'
import { TOKEN_ISSUER } from '../../domain/services/token-issuer.token.ts'
import type { ChangePasswordBody } from '../../presentation/dtos/change-password.request.dto.ts'

@Injectable()
export class ChangePasswordUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: ITokenIssuer,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(auth: AuthUser, body: ChangePasswordBody): Promise<Session> {
    const user = await this.userRepository.findById(auth.id)
    if (user === null) throw new SessionExpiredError('account no longer exists')

    if (!(await this.hasher.verify(body.currentPassword, user.passwordHash))) throw new InvalidCredentialsError()

    const passwordHash = await this.hasher.hash(body.newPassword)
    const updated = await this.userRepository.updatePasswordHash(user.id, passwordHash, this.clock.now())
    if (updated === null) throw new SessionExpiredError('account no longer exists')

    const issued = await this.tokens.issue(updated.id)
    return { token: issued.token, expiresAt: issued.expiresAt, user: toCurrentUser(updated, auth.memberships) }
  }
}
