import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import { type Database, DATABASE_CONNECTION } from '../../../../infrastructure/database/database.token.ts'
import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { MembershipRole, MembershipStatus } from '../../../../shared/domain/roles.constant.ts'
import type { IAtelierRepository } from '../../../atelier/domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../../atelier/domain/repositories/atelier.repository.token.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import type { OnboardingResult } from '../../domain/entities/membership.entity.ts'
import { AtelierNotJoinableError } from '../../domain/errors/membership.errors.ts'
import type { IMembershipRepository } from '../../domain/repositories/membership.repository.interface.ts'
import { MEMBERSHIP_REPOSITORY } from '../../domain/repositories/membership.repository.token.ts'
import type { CompleteOnboardingBody } from '../../presentation/dtos/complete-onboarding.request.dto.ts'

@Injectable()
export class CompleteOnboardingUsecase {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: IMembershipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(body: CompleteOnboardingBody): Promise<OnboardingResult> {
    const user = this.authContext.user
    const atelier = await this.atelierRepository.findPublishedById(body.atelierId)
    if (atelier === null) throw new AtelierNotJoinableError(body.atelierId)

    const now = this.clock.now()

    return this.db.transaction(async (tx) => {
      const membership =
        (await this.membershipRepository.find(user.id, atelier.id, tx)) ??
        (await this.membershipRepository.insert(
          {
            id: randomUUID(),
            userId: user.id,
            atelierId: atelier.id,
            role: MembershipRole.MEMBER,
            status: MembershipStatus.ACTIVE,
            joinedAt: now,
          },
          tx
        ))

      await this.userRepository.markOnboarded(user.id, body.practice, now, tx)

      return {
        atelierId: atelier.id,
        atelierSlug: atelier.slug,
        atelierName: atelier.name,
        role: membership.role,
        practice: body.practice,
        joinedAt: membership.joinedAt,
      }
    })
  }
}
