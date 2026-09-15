import type { MembershipRole, PlatformRole } from './roles.constant.ts'

export interface AuthMembership {
  readonly atelierId: string
  readonly role: MembershipRole
}

export interface AuthUser {
  readonly id: string
  readonly platformRole: PlatformRole
  readonly memberships: ReadonlyArray<AuthMembership>
}
