export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const USER_STATUSES = [UserStatus.ACTIVE, UserStatus.SUSPENDED] as const

export const ADMIN_USERS_LIMIT = 50
export const MAX_PRACTICES = 12
