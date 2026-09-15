export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const ADMIN_USERS_LIMIT = 50
export const PASSWORD_MIN_LENGTH = 8
export const MAX_PRACTICES = 12
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
