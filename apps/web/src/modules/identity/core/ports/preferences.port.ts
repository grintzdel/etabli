import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import type { IdentityResult } from '../model/session'

export interface IPreferencesPort {
  get(token: string): Promise<IdentityResult<UserPreferences>>
  update(token: string, patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>>
  myAteliers(token: string): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>>
}
