import * as Context from 'effect/Context'

import type { AtelierId, UserId } from '../schema/branded-ids'
import type { MembershipRole, PlatformRole } from './roles.constant'

export interface AuthMembership {
  readonly atelierId: AtelierId
  readonly role: MembershipRole
}

export interface AuthContextService {
  readonly userId: UserId
  readonly platformRole: PlatformRole
  readonly memberships: ReadonlyArray<AuthMembership>
}

export class AuthContext extends Context.Tag('@etabli/AuthContext')<AuthContext, AuthContextService>() {}
