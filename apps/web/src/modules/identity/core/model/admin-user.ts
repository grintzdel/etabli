import type {
  AdminUser,
  AdminUsersQuery,
  MemberAtelier,
  MembershipRole,
  PlatformRole,
  UpdateAdminUser,
  UserStatus,
} from '@etabli/contract'

export type { AdminUser, AdminUsersQuery, MemberAtelier, MembershipRole, PlatformRole, UpdateAdminUser, UserStatus }

export const MEMBERSHIP_ROLE_LABELS: Readonly<Record<MembershipRole, string>> = {
  MEMBER: 'Membre',
  FABMANAGER: 'Fabmanager',
}

export const isMembershipRole = (value: string): value is MembershipRole => value === 'MEMBER' || value === 'FABMANAGER'

export const ADMIN_USERS_LIMIT = 50

export const PLATFORM_ROLES: ReadonlyArray<PlatformRole> = ['MEMBER', 'PLATFORM_ADMIN']

export const USER_STATUSES: ReadonlyArray<UserStatus> = ['ACTIVE', 'SUSPENDED']

export const PLATFORM_ROLE_LABELS: Readonly<Record<PlatformRole, string>> = {
  MEMBER: 'Membre',
  PLATFORM_ADMIN: 'Administrateur',
}

export const USER_STATUS_LABELS: Readonly<Record<UserStatus, string>> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
}

export const USER_STATUS_TONES: Readonly<Record<UserStatus, 'ok' | 'danger'>> = {
  ACTIVE: 'ok',
  SUSPENDED: 'danger',
}

export const isPlatformRole = (value: string): value is PlatformRole => PLATFORM_ROLES.some((role) => role === value)

export const isUserStatus = (value: string): value is UserStatus => USER_STATUSES.some((status) => status === value)

export const parseAdminUsersQuery = (
  params: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>
): AdminUsersQuery => {
  const first = (key: string): string | undefined => {
    const raw = params[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }

  const search = first('search')
  const platformRole = first('platformRole')
  const status = first('status')

  return {
    ...(search === undefined ? {} : { search }),
    ...(platformRole !== undefined && isPlatformRole(platformRole) ? { platformRole } : {}),
    ...(status !== undefined && isUserStatus(status) ? { status } : {}),
  }
}
