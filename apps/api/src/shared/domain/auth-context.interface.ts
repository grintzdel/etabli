import type { AuthUser } from './auth-user.ts'

export interface IAuthContext {
  readonly user: AuthUser
}
