export type PlatformRole = 'MEMBER' | 'PLATFORM_ADMIN'

export type CurrentUser = {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly platformRole: PlatformRole
  readonly createdAt: string
}

export type Session = {
  readonly token: string
  readonly expiresAt: string
  readonly user: CurrentUser
}

export type RegisterInput = {
  readonly email: string
  readonly password: string
  readonly displayName: string
}

export type LoginInput = {
  readonly email: string
  readonly password: string
}
