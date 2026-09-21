import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UserStatus } from '../../../user/domain/constants/user.constant.ts'
import { toCurrentUser } from '../../../user/domain/entities/user.entity.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import type { Session } from '../../domain/entities/session.entity.ts'
import { EmailAlreadyTakenError } from '../../domain/errors/auth.errors.ts'
import type { IPasswordHasher } from '../../domain/services/password-hasher.interface.ts'
import { PASSWORD_HASHER } from '../../domain/services/password-hasher.token.ts'
import type { ITokenIssuer } from '../../domain/services/token-issuer.interface.ts'
import { TOKEN_ISSUER } from '../../domain/services/token-issuer.token.ts'
import type { RegisterBody } from '../../presentation/dtos/register.request.dto.ts'

@Injectable()
export class RegisterUserUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: ITokenIssuer,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(body: RegisterBody): Promise<Session> {
    const existing = await this.userRepository.findByEmail(body.email)
    if (existing !== null) throw new EmailAlreadyTakenError(body.email)

    const user = await this.userRepository.insert({
      id: randomUUID(),
      email: body.email,
      passwordHash: await this.hasher.hash(body.password),
      displayName: body.displayName,
      platformRole: PlatformRole.MEMBER,
      practice: [],
      status: UserStatus.ACTIVE,
      createdAt: this.clock.now(),
    })

    const issued = await this.tokens.issue(user.id)
    return { token: issued.token, expiresAt: issued.expiresAt, user: toCurrentUser(user) }
  }
}
