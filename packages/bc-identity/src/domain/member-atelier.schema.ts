import { MembershipRoleSchema } from '@etabli/shared/auth-context'
import { AtelierId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

export const MemberAtelierSchema = Schema.Struct({
  id: AtelierId,
  slug: Schema.String,
  name: Schema.String,
  role: MembershipRoleSchema,
})
export type MemberAtelier = Schema.Schema.Type<typeof MemberAtelierSchema>
