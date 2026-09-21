import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import { DEFAULT_THEME } from '../model/preferences'
import type { IdentityResult } from '../model/session'
import { failure, IdentityFailureCode } from '../model/session'
import type { IPreferencesPort } from '../ports/preferences.port'

export class PreferencesInMemoryAdapter implements IPreferencesPort {
  private readonly preferences = new Map<string, UserPreferences>()
  private readonly ateliers = new Map<string, ReadonlyArray<MemberAtelier>>()

  constructor(seed: ReadonlyArray<{ readonly token: string; readonly ateliers?: ReadonlyArray<MemberAtelier> }> = []) {
    for (const entry of seed) {
      this.preferences.set(entry.token, {
        userId: entry.token,
        theme: DEFAULT_THEME,
        defaultAtelierId: null,
        updatedAt: null,
      })
      this.ateliers.set(entry.token, entry.ateliers ?? [])
    }
  }

  async get(token: string): Promise<IdentityResult<UserPreferences>> {
    const current = this.preferences.get(token)
    if (current === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)
    return { ok: true, value: current }
  }

  async update(token: string, patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>> {
    const current = this.preferences.get(token)
    if (current === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)

    const joined = this.ateliers.get(token) ?? []
    if (
      patch.defaultAtelierId !== undefined &&
      patch.defaultAtelierId !== null &&
      !joined.some((atelier) => atelier.id === patch.defaultAtelierId)
    ) {
      return failure(IdentityFailureCode.PREFERRED_ATELIER_NOT_JOINED)
    }

    const next: UserPreferences = {
      ...current,
      theme: patch.theme ?? current.theme,
      defaultAtelierId: patch.defaultAtelierId === undefined ? current.defaultAtelierId : patch.defaultAtelierId,
      updatedAt: new Date().toISOString(),
    }
    this.preferences.set(token, next)
    return { ok: true, value: next }
  }

  async myAteliers(token: string): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    const joined = this.ateliers.get(token)
    if (joined === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)
    return { ok: true, value: joined }
  }
}
