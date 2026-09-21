import { Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { MemberAtelier, MembershipEntity, OnboardingResult } from '../../domain/entities/membership.entity.ts'
import type { CompleteOnboardingBody } from '../../presentation/dtos/complete-onboarding.request.dto.ts'
import type { SetMembershipRoleBody } from '../../presentation/dtos/set-membership-role.request.dto.ts'
import { CompleteOnboardingUsecase } from '../use-cases/complete-onboarding.usecase.ts'
import { ListMyAteliersUsecase } from '../use-cases/list-my-ateliers.usecase.ts'
import { SetMembershipRoleUsecase } from '../use-cases/set-membership-role.usecase.ts'

@Injectable()
export class MembershipService {
  constructor(
    private readonly completeOnboardingUsecase: CompleteOnboardingUsecase,
    private readonly listMyAteliersUsecase: ListMyAteliersUsecase,
    private readonly setMembershipRoleUsecase: SetMembershipRoleUsecase
  ) {}

  public async completeOnboarding(user: AuthUser, body: CompleteOnboardingBody): Promise<OnboardingResult> {
    return this.completeOnboardingUsecase.execute(user, body)
  }

  public async listMyAteliers(user: AuthUser): Promise<ReadonlyArray<MemberAtelier>> {
    return this.listMyAteliersUsecase.execute(user)
  }

  public async setRole(atelierId: string, userId: string, body: SetMembershipRoleBody): Promise<MembershipEntity> {
    return this.setMembershipRoleUsecase.execute(atelierId, userId, body)
  }
}
