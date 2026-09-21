import { z } from 'zod'

import type { AuthMembership } from '../../../../shared/domain/auth-user.ts'
import { MEMBERSHIP_ROLES, PLATFORM_ROLES } from '../../../../shared/domain/roles.constant.ts'
import { THEMES } from '../../domain/constants/preferences.constant.ts'
import { USER_STATUSES } from '../../domain/constants/user.constant.ts'
import type {
  AdminUserEntity,
  CurrentUser,
  MemberAtelier,
  UserPreferencesEntity,
} from '../../domain/entities/user.entity.ts'

export const memberAtelierResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  role: z.enum(MEMBERSHIP_ROLES),
})
export type MemberAtelierResponse = z.infer<typeof memberAtelierResponseSchema>

export const authMembershipResponseSchema = z.object({
  atelierId: z.uuid(),
  role: z.enum(MEMBERSHIP_ROLES),
})

export const currentUserResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
  platformRole: z.enum(PLATFORM_ROLES),
  practice: z.array(z.string()),
  onboardingCompletedAt: z.iso.datetime().nullable(),
  memberships: z.array(authMembershipResponseSchema),
  createdAt: z.iso.datetime(),
})
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>

export const userPreferencesResponseSchema = z.object({
  userId: z.uuid(),
  theme: z.enum(THEMES),
  defaultAtelierId: z.uuid().nullable(),
  updatedAt: z.iso.datetime().nullable(),
})
export type UserPreferencesResponse = z.infer<typeof userPreferencesResponseSchema>

export const adminUserResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
  platformRole: z.enum(PLATFORM_ROLES),
  status: z.enum(USER_STATUSES),
  practice: z.array(z.string()),
  onboardingCompletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  ateliers: z.array(memberAtelierResponseSchema),
})
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>

export const toMemberAtelierResponse = (atelier: MemberAtelier): MemberAtelierResponse => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  role: atelier.role,
})

const toAuthMembershipResponse = (membership: AuthMembership) => ({
  atelierId: membership.atelierId,
  role: membership.role,
})

export const toCurrentUserResponse = (user: CurrentUser): CurrentUserResponse => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  platformRole: user.platformRole,
  practice: [...user.practice],
  onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
  memberships: user.memberships.map(toAuthMembershipResponse),
  createdAt: user.createdAt.toISOString(),
})

export const toUserPreferencesResponse = (preferences: UserPreferencesEntity): UserPreferencesResponse => ({
  userId: preferences.userId,
  theme: preferences.theme,
  defaultAtelierId: preferences.defaultAtelierId,
  updatedAt: preferences.updatedAt?.toISOString() ?? null,
})

export const toAdminUserResponse = (user: AdminUserEntity): AdminUserResponse => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  platformRole: user.platformRole,
  status: user.status,
  practice: [...user.practice],
  onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  ateliers: user.ateliers.map(toMemberAtelierResponse),
})
