export type PlatformRole = 'MEMBER' | 'PLATFORM_ADMIN'

export type MembershipRole = 'MEMBER' | 'FABMANAGER'

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
