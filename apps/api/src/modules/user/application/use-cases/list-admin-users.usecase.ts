import { Inject, Injectable } from '@nestjs/common'

import type { AdminUserEntity } from '../../domain/entities/user.entity.ts'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.token.ts'
import type { ListAdminUsersQuery } from '../../presentation/dtos/list-admin-users.request.dto.ts'

@Injectable()
export class ListAdminUsersUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(query: ListAdminUsersQuery): Promise<ReadonlyArray<AdminUserEntity>> {
    return this.userRepository.listForAdmin(query)
  }
}
