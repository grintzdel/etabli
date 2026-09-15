import { routes } from '@etabli/contract'

import { requestIdentity } from '../lib/identity-http'
import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import type { IdentityResult } from '../model/session'
import type { IPreferencesPort } from '../ports/preferences.port'

export class PreferencesHttpAdapter implements IPreferencesPort {
  constructor(private readonly baseUrl: string) {}

  get(token: string): Promise<IdentityResult<UserPreferences>> {
    return requestIdentity<UserPreferences>(this.baseUrl, routes.me.preferences, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })
  }

  myAteliers(token: string): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    return requestIdentity<ReadonlyArray<MemberAtelier>>(this.baseUrl, routes.me.ateliers, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })
  }

  update(token: string, patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>> {
    return requestIdentity<UserPreferences>(this.baseUrl, routes.me.preferences, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
  }
}
