import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
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
  private readonly anonymous: ApiClient<IdentityFailureCode>
  private readonly authenticated: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    const shared = {
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: identityFailureOf,
      cache: 'no-store' as const,
    }
    this.anonymous = createApiClient(shared)
    this.authenticated = createApiClient({ ...shared, getAuthToken })
  }

  register(input: RegisterInput): Promise<IdentityResult<Session>> {
    return this.anonymous.post<Session>(routes.auth.register, input)
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return this.anonymous.post<Session>(routes.auth.login, input)
  }

  me(): Promise<IdentityResult<CurrentUser>> {
    return this.authenticated.get<CurrentUser>(routes.auth.me)
  }

  changePassword(input: ChangePasswordInput): Promise<IdentityResult<Session>> {
    return this.authenticated.post<Session>(routes.auth.password, input)
  }

  updateProfile(patch: UpdateProfileInput): Promise<IdentityResult<CurrentUser>> {
    return this.authenticated.patch<CurrentUser>(routes.me.profile, patch)
  }
}
