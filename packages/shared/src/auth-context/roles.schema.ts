import * as Schema from 'effect/Schema'

import type { AssertEquals } from '../type-level/assert-equals'
import type { MembershipRole, MembershipStatus, PlatformRole } from './roles.constant'

export const PlatformRoleSchema = Schema.Literal('MEMBER', 'PLATFORM_ADMIN')
export const MembershipRoleSchema = Schema.Literal('MEMBER', 'FABMANAGER')
export const MembershipStatusSchema = Schema.Literal('ACTIVE', 'SUSPENDED')

export const platformRoleParity: AssertEquals<Schema.Schema.Type<typeof PlatformRoleSchema>, PlatformRole> = true
export const membershipRoleParity: AssertEquals<Schema.Schema.Type<typeof MembershipRoleSchema>, MembershipRole> = true
export const membershipStatusParity: AssertEquals<
  Schema.Schema.Type<typeof MembershipStatusSchema>,
  MembershipStatus
> = true
