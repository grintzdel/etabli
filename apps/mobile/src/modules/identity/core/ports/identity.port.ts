import type { CurrentUser, IdentityResult, LoginInput, MemberAtelier, RegisterInput, Session } from '../model/session'

export interface IIdentityPort {
  register(input: RegisterInput): Promise<IdentityResult<Session>>
  login(input: LoginInput): Promise<IdentityResult<Session>>
  me(): Promise<IdentityResult<CurrentUser>>
  myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>>
}
