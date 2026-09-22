import type { Transactable } from '../../../../infrastructure/database/database.token.ts'
import type { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import type { UserStatus } from '../constants/user.constant.ts'
import type { AdminUserEntity, UserEntity, UserPreferencesEntity } from '../entities/user.entity.ts'

export type NewUser = Omit<UserEntity, 'onboardingCompletedAt' | 'updatedAt'>

export type UpdateProfileInput = Partial<Pick<UserEntity, 'displayName' | 'practice'>>

export type UpdateAdminUserInput = Partial<Pick<UserEntity, 'platformRole' | 'status'>>

export interface AdminUsersFilter {
  readonly search?: string
  readonly platformRole?: PlatformRole
  readonly status?: UserStatus
}

export type UpdatePreferencesInput = Partial<Pick<UserPreferencesEntity, 'theme' | 'defaultAtelierId'>>

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  insert(user: NewUser): Promise<UserEntity>
  updateProfile(id: string, patch: UpdateProfileInput, at: Date): Promise<UserEntity | null>
  updatePasswordHash(id: string, passwordHash: string, at: Date): Promise<UserEntity | null>
  markOnboarded(id: string, practice: ReadonlyArray<string>, at: Date, tx?: Transactable): Promise<UserEntity | null>
  updateAdminState(id: string, patch: UpdateAdminUserInput, at: Date): Promise<UserEntity | null>
  listForAdmin(filter: AdminUsersFilter): Promise<ReadonlyArray<AdminUserEntity>>
  findAdminById(id: string): Promise<AdminUserEntity | null>
  namesOf(userIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, string>>
  findPreferences(userId: string): Promise<UserPreferencesEntity | null>
  upsertPreferences(userId: string, patch: UpdatePreferencesInput, at: Date): Promise<UserPreferencesEntity>
}
