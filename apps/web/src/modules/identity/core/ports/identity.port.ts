import type { ChangePasswordInput, UpdateProfileInput } from '../model/profile'
import type { CurrentUser, IdentityResult, LoginInput, RegisterInput, Session } from '../model/session'

export interface IIdentityPort {
  register(input: RegisterInput): Promise<IdentityResult<Session>>
  login(input: LoginInput): Promise<IdentityResult<Session>>
  me(): Promise<IdentityResult<CurrentUser>>
  updateProfile(patch: UpdateProfileInput): Promise<IdentityResult<CurrentUser>>
  changePassword(input: ChangePasswordInput): Promise<IdentityResult<Session>>
}
