import { Inject, Injectable } from '@nestjs/common'

import type { MembershipEntity } from '../../domain/entities/membership.entity.ts'
import { MembershipUnknownError } from '../../domain/errors/membership.errors.ts'
import type { IMembershipRepository } from '../../domain/repositories/membership.repository.interface.ts'
import { MEMBERSHIP_REPOSITORY } from '../../domain/repositories/membership.repository.token.ts'
import type { SetMembershipRoleBody } from '../../presentation/dtos/set-membership-role.request.dto.ts'

@Injectable()
export class SetMembershipRoleUsecase {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: IMembershipRepository) {}

  async execute(atelierId: string, userId: string, body: SetMembershipRoleBody): Promise<MembershipEntity> {
    const updated = await this.membershipRepository.updateRole(userId, atelierId, body.role)
    if (updated === null) throw new MembershipUnknownError(atelierId, userId)
    return updated
  }
}
