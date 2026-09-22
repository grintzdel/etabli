import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import {
  FAILURE_MESSAGES,
  type CurrentUser,
  type IdentityFailureCode,
  type IdentityResult,
  type LoginInput,
  type MemberAtelier,
  type Session,
} from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityHttpAdapter implements IIdentityPort {
  private readonly anonymous: ApiClient<IdentityFailureCode>
  private readonly authenticated: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    const shared = { baseUrl, messages: FAILURE_MESSAGES, failureOf: identityFailureOf }
    this.anonymous = createApiClient(shared)
    this.authenticated = createApiClient({ ...shared, getAuthToken })
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return this.anonymous.post<Session>(routes.auth.login, input)
  }

  me(): Promise<IdentityResult<CurrentUser>> {
    return this.authenticated.get<CurrentUser>(routes.auth.me)
  }

  myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    return this.authenticated.get<ReadonlyArray<MemberAtelier>>(routes.me.ateliers)
  }
}
