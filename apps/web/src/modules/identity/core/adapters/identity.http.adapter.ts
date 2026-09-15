import { routes } from '@etabli/contract'

import { requestIdentity } from '../lib/identity-http'
import type { ChangePasswordInput, UpdateProfileInput } from '../model/profile'
import type { CurrentUser, IdentityResult, LoginInput, RegisterInput, Session } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityHttpAdapter implements IIdentityPort {
  constructor(private readonly baseUrl: string) {}

  register(input: RegisterInput): Promise<IdentityResult<Session>> {
    return requestIdentity<Session>(this.baseUrl, routes.auth.register, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return requestIdentity<Session>(this.baseUrl, routes.auth.login, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  }

  me(token: string): Promise<IdentityResult<CurrentUser>> {
    return requestIdentity<CurrentUser>(this.baseUrl, routes.auth.me, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })
  }

  changePassword(token: string, input: ChangePasswordInput): Promise<IdentityResult<Session>> {
    return requestIdentity<Session>(this.baseUrl, routes.auth.password, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    })
  }

  updateProfile(token: string, patch: UpdateProfileInput): Promise<IdentityResult<CurrentUser>> {
    return requestIdentity<CurrentUser>(this.baseUrl, routes.auth.me, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
  }
}
