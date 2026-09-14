import * as Schema from 'effect/Schema'

import type { AssertEquals } from '../type-level/assert-equals'
import type { MembershipRole, PlatformRole } from './roles.constant'

export const PlatformRoleSchema = Schema.Literal('MEMBER', 'PLATFORM_ADMIN')
export const MembershipRoleSchema = Schema.Literal('MEMBER', 'FABMANAGER')

export const platformRoleParity: AssertEquals<Schema.Schema.Type<typeof PlatformRoleSchema>, PlatformRole> = true
export const membershipRoleParity: AssertEquals<Schema.Schema.Type<typeof MembershipRoleSchema>, MembershipRole> = true
