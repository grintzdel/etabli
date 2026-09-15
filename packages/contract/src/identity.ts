export type PlatformRole = 'MEMBER' | 'PLATFORM_ADMIN'

export type MembershipRole = 'MEMBER' | 'FABMANAGER'

export type MembershipStatus = 'ACTIVE' | 'SUSPENDED'

export type Membership = {
  readonly atelierId: string
  readonly role: MembershipRole
}

export type CurrentUser = {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly platformRole: PlatformRole
  readonly practice: ReadonlyArray<string>
  readonly onboardingCompletedAt: string | null
  readonly memberships: ReadonlyArray<Membership>
  readonly createdAt: string
}

export type Session = {
  readonly token: string
  readonly expiresAt: string
  readonly user: CurrentUser
}

export type RegisterInput = {
  readonly email: string
  readonly password: string
  readonly displayName: string
}

export type LoginInput = {
  readonly email: string
  readonly password: string
}

export type Theme = 'dark' | 'light' | 'system'

export type UserPreferences = {
  readonly userId: string
  readonly theme: Theme
  readonly defaultAtelierId: string | null
  readonly updatedAt: string | null
}

export type UpdatePreferencesInput = {
  readonly theme?: Theme
  readonly defaultAtelierId?: string | null
}

export type MemberAtelier = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly role: MembershipRole
}

export type UpdateProfileInput = {
  readonly displayName?: string
  readonly practice?: ReadonlyArray<string>
}

export type ChangePasswordInput = {
  readonly currentPassword: string
  readonly newPassword: string
}

export type UserStatus = 'ACTIVE' | 'SUSPENDED'

export type AdminUser = {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly platformRole: PlatformRole
  readonly status: UserStatus
  readonly practice: ReadonlyArray<string>
  readonly onboardingCompletedAt: string | null
  readonly createdAt: string
  readonly ateliers: ReadonlyArray<MemberAtelier>
}

export type AdminUsersQuery = {
  readonly search?: string
  readonly platformRole?: PlatformRole
  readonly status?: UserStatus
}

export type UpdateAdminUser = {
  readonly platformRole?: PlatformRole
  readonly status?: UserStatus
}
