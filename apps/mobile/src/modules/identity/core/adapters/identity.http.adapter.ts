import { routes } from '@etabli/contract'

import { requestIdentity } from '../lib/identity-http'
import type { CurrentUser, IdentityResult, LoginInput, Session } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityHttpAdapter implements IIdentityPort {
  constructor(private readonly baseUrl: string) {}

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return requestIdentity<Session>(this.baseUrl, routes.auth.login, { method: 'POST', body: input })
  }

  me(token: string): Promise<IdentityResult<CurrentUser>> {
    return requestIdentity<CurrentUser>(this.baseUrl, routes.auth.me, { token })
  }
}
