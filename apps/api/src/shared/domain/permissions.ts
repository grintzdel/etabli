import type { AuthUser } from './auth-user.ts'
import { MembershipRole, PlatformRole } from './roles.constant.ts'

export const isPlatformAdmin = (user: AuthUser): boolean => user.platformRole === PlatformRole.PLATFORM_ADMIN

export const isMemberOf = (user: AuthUser, atelierId: string): boolean =>
  user.memberships.some((membership) => membership.atelierId === atelierId)

export const isFabmanagerOf = (user: AuthUser, atelierId: string): boolean =>
  user.memberships.some(
    (membership) => membership.atelierId === atelierId && membership.role === MembershipRole.FABMANAGER
  )

export const fabmanagedAtelierIds = (user: AuthUser): ReadonlyArray<string> =>
  user.memberships
    .filter((membership) => membership.role === MembershipRole.FABMANAGER)
    .map((membership) => membership.atelierId)
