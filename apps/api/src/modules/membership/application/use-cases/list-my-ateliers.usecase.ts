import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { MemberAtelier } from '../../domain/entities/membership.entity.ts'
import type { IMembershipRepository } from '../../domain/repositories/membership.repository.interface.ts'
import { MEMBERSHIP_REPOSITORY } from '../../domain/repositories/membership.repository.token.ts'

@Injectable()
export class ListMyAteliersUsecase {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: IMembershipRepository) {}

  async execute(user: AuthUser): Promise<ReadonlyArray<MemberAtelier>> {
    return this.membershipRepository.listMemberAteliers(user.id)
  }
}
