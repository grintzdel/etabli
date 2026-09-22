import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import type { IdentityResult } from '../model/session'

export interface IPreferencesPort {
  get(): Promise<IdentityResult<UserPreferences>>
  update(patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>>
  myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>>
}
