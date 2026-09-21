import { createApiClient, type ApiClient } from '@etabli/api-client'
import { routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import type { ChangePasswordInput, UpdateProfileInput } from '../model/profile'
import type {
  CurrentUser,
  IdentityFailureCode,
  IdentityResult,
  LoginInput,
  RegisterInput,
  Session,
} from '../model/session'
import { FAILURE_MESSAGES } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityHttpAdapter implements IIdentityPort {
  private readonly http: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: identityFailureOf,
      cache: 'no-store',
    })
  }

  register(input: RegisterInput): Promise<IdentityResult<Session>> {
    return this.http.call<Session>(routes.auth.register, { method: 'POST', body: input })
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return this.http.call<Session>(routes.auth.login, { method: 'POST', body: input })
  }

  me(token: string): Promise<IdentityResult<CurrentUser>> {
    return this.http.call<CurrentUser>(routes.auth.me, { token })
  }

  changePassword(token: string, input: ChangePasswordInput): Promise<IdentityResult<Session>> {
    return this.http.call<Session>(routes.auth.password, { method: 'POST', token, body: input })
  }

  updateProfile(token: string, patch: UpdateProfileInput): Promise<IdentityResult<CurrentUser>> {
    return this.http.call<CurrentUser>(routes.me.profile, { method: 'PATCH', token, body: patch })
  }
}
