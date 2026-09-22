import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import type { IdentityFailureCode, IdentityResult } from '../model/session'
import { FAILURE_MESSAGES } from '../model/session'
import type { IPreferencesPort } from '../ports/preferences.port'

export class PreferencesHttpAdapter implements IPreferencesPort {
  private readonly authenticated: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: identityFailureOf,
      getAuthToken,
      cache: 'no-store',
    })
  }

  get(): Promise<IdentityResult<UserPreferences>> {
    return this.authenticated.get<UserPreferences>(routes.me.preferences)
  }

  myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    return this.authenticated.get<ReadonlyArray<MemberAtelier>>(routes.me.ateliers)
  }

  update(patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>> {
    return this.authenticated.patch<UserPreferences>(routes.me.preferences, patch)
  }
}
