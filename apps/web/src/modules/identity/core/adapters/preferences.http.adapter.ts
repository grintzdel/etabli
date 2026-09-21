import { createApiClient, type ApiClient } from '@etabli/api-client'
import { routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import type { IdentityFailureCode, IdentityResult } from '../model/session'
import { FAILURE_MESSAGES } from '../model/session'
import type { IPreferencesPort } from '../ports/preferences.port'

export class PreferencesHttpAdapter implements IPreferencesPort {
  private readonly http: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: identityFailureOf,
      cache: 'no-store',
    })
  }

  get(token: string): Promise<IdentityResult<UserPreferences>> {
    return this.http.call<UserPreferences>(routes.me.preferences, { token })
  }

  myAteliers(token: string): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    return this.http.call<ReadonlyArray<MemberAtelier>>(routes.me.ateliers, { token })
  }

  update(token: string, patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>> {
    return this.http.call<UserPreferences>(routes.me.preferences, { method: 'PATCH', token, body: patch })
  }
}
