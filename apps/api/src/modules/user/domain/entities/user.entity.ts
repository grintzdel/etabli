import type { AuthMembership } from '../../../../shared/domain/auth-user.ts'
import type { MembershipRole, PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import type { Theme } from '../constants/preferences.constant.ts'
import type { UserStatus } from '../constants/user.constant.ts'

export interface UserEntity {
  readonly id: string
  readonly email: string
  readonly passwordHash: string
  readonly displayName: string
  readonly platformRole: PlatformRole
  readonly practice: ReadonlyArray<string>
  readonly onboardingCompletedAt: Date | null
  readonly status: UserStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface MemberAtelier {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly role: MembershipRole
}

export interface CurrentUser {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly platformRole: PlatformRole
  readonly practice: ReadonlyArray<string>
  readonly onboardingCompletedAt: Date | null
  readonly memberships: ReadonlyArray<AuthMembership>
  readonly createdAt: Date
}

export interface AdminUserEntity extends Omit<UserEntity, 'passwordHash' | 'updatedAt'> {
  readonly ateliers: ReadonlyArray<MemberAtelier>
}

export interface UserPreferencesEntity {
  readonly userId: string
  readonly theme: Theme
  readonly defaultAtelierId: string | null
  readonly updatedAt: Date | null
}

export const toCurrentUser = (user: UserEntity, memberships: ReadonlyArray<AuthMembership> = []): CurrentUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  platformRole: user.platformRole,
  practice: user.practice,
  onboardingCompletedAt: user.onboardingCompletedAt,
  memberships,
  createdAt: user.createdAt,
})
