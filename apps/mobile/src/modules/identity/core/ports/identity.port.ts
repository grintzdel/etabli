import type { CurrentUser, IdentityResult, LoginInput, Session } from '../model/session'

export interface IIdentityPort {
  login(input: LoginInput): Promise<IdentityResult<Session>>
  me(token: string): Promise<IdentityResult<CurrentUser>>
}
