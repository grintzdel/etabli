import * as Schema from 'effect/Schema'

import { AtelierId } from '../schema/branded-ids'
import type { AssertEquals } from '../type-level/assert-equals'
import type { AuthMembership } from './auth-context'
import { MembershipRoleSchema } from './roles.schema'

export const AuthMembershipSchema = Schema.Struct({
  atelierId: AtelierId,
  role: MembershipRoleSchema,
})

export const authMembershipParity: AssertEquals<Schema.Schema.Type<typeof AuthMembershipSchema>, AuthMembership> = true
