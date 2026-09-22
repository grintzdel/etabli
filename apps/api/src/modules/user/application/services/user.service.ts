import { Injectable } from '@nestjs/common'

import type { AdminUserEntity, CurrentUser, UserPreferencesEntity } from '../../domain/entities/user.entity.ts'
import type { ListAdminUsersQuery } from '../../presentation/dtos/list-admin-users.request.dto.ts'
import type { UpdateAdminUserBody } from '../../presentation/dtos/update-admin-user.request.dto.ts'
import type { UpdatePreferencesBody } from '../../presentation/dtos/update-preferences.request.dto.ts'
import type { UpdateProfileBody } from '../../presentation/dtos/update-profile.request.dto.ts'
import { GetPreferencesUsecase } from '../use-cases/get-preferences.usecase.ts'
import { ListAdminUsersUsecase } from '../use-cases/list-admin-users.usecase.ts'
import { UpdateAdminUserUsecase } from '../use-cases/update-admin-user.usecase.ts'
import { UpdatePreferencesUsecase } from '../use-cases/update-preferences.usecase.ts'
import { UpdateProfileUsecase } from '../use-cases/update-profile.usecase.ts'

@Injectable()
export class UserService {
  constructor(
    private readonly updateProfileUsecase: UpdateProfileUsecase,
    private readonly getPreferencesUsecase: GetPreferencesUsecase,
    private readonly updatePreferencesUsecase: UpdatePreferencesUsecase,
    private readonly listAdminUsersUsecase: ListAdminUsersUsecase,
    private readonly updateAdminUserUsecase: UpdateAdminUserUsecase
  ) {}

  public async updateProfile(body: UpdateProfileBody): Promise<CurrentUser> {
    return this.updateProfileUsecase.execute(body)
  }

  public async getPreferences(): Promise<UserPreferencesEntity> {
    return this.getPreferencesUsecase.execute()
  }

  public async updatePreferences(body: UpdatePreferencesBody): Promise<UserPreferencesEntity> {
    return this.updatePreferencesUsecase.execute(body)
  }

  public async listAdminUsers(query: ListAdminUsersQuery): Promise<ReadonlyArray<AdminUserEntity>> {
    return this.listAdminUsersUsecase.execute(query)
  }

  public async updateAdminUser(userId: string, body: UpdateAdminUserBody): Promise<AdminUserEntity> {
    return this.updateAdminUserUsecase.execute(userId, body)
  }
}
