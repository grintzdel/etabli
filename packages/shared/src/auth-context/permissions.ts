import type { AtelierId } from '../schema/branded-ids'
import type { AuthContextService } from './auth-context'
import { MembershipRole, PlatformRole } from './roles.constant'

export const isPlatformAdmin = (auth: AuthContextService): boolean => auth.platformRole === PlatformRole.PLATFORM_ADMIN

export const isMemberOf = (auth: AuthContextService, atelierId: AtelierId): boolean =>
  auth.memberships.some((membership) => membership.atelierId === atelierId)

export const isFabmanagerOf = (auth: AuthContextService, atelierId: AtelierId): boolean =>
  auth.memberships.some(
    (membership) => membership.atelierId === atelierId && membership.role === MembershipRole.FABMANAGER
  )
