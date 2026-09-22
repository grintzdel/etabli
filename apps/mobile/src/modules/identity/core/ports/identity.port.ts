import type { CurrentUser, IdentityResult, LoginInput, MemberAtelier, Session } from '../model/session'

export interface IIdentityPort {
  login(input: LoginInput): Promise<IdentityResult<Session>>
  me(): Promise<IdentityResult<CurrentUser>>
  myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>>
}
