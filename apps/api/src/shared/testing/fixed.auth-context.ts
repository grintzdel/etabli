import type { IAuthContext } from '../domain/auth-context.interface.ts'
import type { AuthUser } from '../domain/auth-user.ts'

export class FixedAuthContext implements IAuthContext {
  private current: AuthUser

  constructor(user: AuthUser) {
    this.current = user
  }

  get user(): AuthUser {
    return this.current
  }

  set(user: AuthUser): void {
    this.current = user
  }
}
