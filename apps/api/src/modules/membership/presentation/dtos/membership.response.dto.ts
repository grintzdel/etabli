import { z } from 'zod'

import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from '../../../../shared/domain/roles.constant.ts'
import type { MembershipEntity, OnboardingResult } from '../../domain/entities/membership.entity.ts'

export const membershipResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  atelierId: z.uuid(),
  role: z.enum(MEMBERSHIP_ROLES),
  status: z.enum(MEMBERSHIP_STATUSES),
  joinedAt: z.iso.datetime(),
})
export type MembershipResponse = z.infer<typeof membershipResponseSchema>

export const onboardingResultResponseSchema = z.object({
  atelierId: z.uuid(),
  atelierSlug: z.string(),
  atelierName: z.string(),
  role: z.enum(MEMBERSHIP_ROLES),
  practice: z.array(z.string()),
  joinedAt: z.iso.datetime(),
})
export type OnboardingResultResponse = z.infer<typeof onboardingResultResponseSchema>

export const toMembershipResponse = (membership: MembershipEntity): MembershipResponse => ({
  id: membership.id,
  userId: membership.userId,
  atelierId: membership.atelierId,
  role: membership.role,
  status: membership.status,
  joinedAt: membership.joinedAt.toISOString(),
})

export const toOnboardingResultResponse = (result: OnboardingResult): OnboardingResultResponse => ({
  atelierId: result.atelierId,
  atelierSlug: result.atelierSlug,
  atelierName: result.atelierName,
  role: result.role,
  practice: [...result.practice],
  joinedAt: result.joinedAt.toISOString(),
})
