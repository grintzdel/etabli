import type { ChangePasswordInput, UpdateProfileInput } from '../model/profile'
import type { CurrentUser, IdentityResult, LoginInput, RegisterInput, Session } from '../model/session'

export interface IIdentityPort {
  register(input: RegisterInput): Promise<IdentityResult<Session>>
  login(input: LoginInput): Promise<IdentityResult<Session>>
  me(token: string): Promise<IdentityResult<CurrentUser>>
  updateProfile(token: string, patch: UpdateProfileInput): Promise<IdentityResult<CurrentUser>>
  changePassword(token: string, input: ChangePasswordInput): Promise<IdentityResult<Session>>
}
