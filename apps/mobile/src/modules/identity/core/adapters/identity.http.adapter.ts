import { createApiClient, type ApiClient } from '@etabli/api-client'
import { routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import {
  FAILURE_MESSAGES,
  type CurrentUser,
  type IdentityFailureCode,
  type IdentityResult,
  type LoginInput,
  type Session,
} from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityHttpAdapter implements IIdentityPort {
  private readonly http: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf: identityFailureOf })
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return this.http.call<Session>(routes.auth.login, { method: 'POST', body: input })
  }

  me(token: string): Promise<IdentityResult<CurrentUser>> {
    return this.http.call<CurrentUser>(routes.auth.me, { token })
  }
}
