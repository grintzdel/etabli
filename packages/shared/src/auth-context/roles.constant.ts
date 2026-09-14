export const PlatformRole = {
  MEMBER: 'MEMBER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole]

export const MembershipRole = {
  MEMBER: 'MEMBER',
  FABMANAGER: 'FABMANAGER',
} as const
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole]

export const MembershipStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus]
