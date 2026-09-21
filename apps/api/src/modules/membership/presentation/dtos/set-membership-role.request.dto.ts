import { z } from 'zod'

import { MembershipRole } from '../../../../shared/domain/roles.constant.ts'

export const setMembershipRoleBodySchema = z
  .object({ role: z.enum([MembershipRole.MEMBER, MembershipRole.FABMANAGER]) })
  .strict()

export type SetMembershipRoleBody = z.infer<typeof setMembershipRoleBodySchema>
