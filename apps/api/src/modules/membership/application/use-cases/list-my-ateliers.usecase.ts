import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { MemberAtelier } from '../../domain/entities/membership.entity.ts'
import type { IMembershipRepository } from '../../domain/repositories/membership.repository.interface.ts'
import { MEMBERSHIP_REPOSITORY } from '../../domain/repositories/membership.repository.token.ts'

@Injectable()
export class ListMyAteliersUsecase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: IMembershipRepository,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(): Promise<ReadonlyArray<MemberAtelier>> {
    const user = this.authContext.user
    return this.membershipRepository.listMemberAteliers(user.id)
  }
}
