import type { AuthTokenProvider } from '@etabli/api-client'

import type { MemberAtelier, UpdatePreferencesInput, UserPreferences } from '../model/preferences'
import { DEFAULT_THEME } from '../model/preferences'
import type { IdentityResult } from '../model/session'
import { failure, IdentityFailureCode } from '../model/session'
import type { IPreferencesPort } from '../ports/preferences.port'

export class PreferencesInMemoryAdapter implements IPreferencesPort {
  private readonly preferences = new Map<string, UserPreferences>()
  private readonly ateliers = new Map<string, ReadonlyArray<MemberAtelier>>()

  constructor(
    private readonly getAuthToken: AuthTokenProvider,
    seed: ReadonlyArray<{ readonly token: string; readonly ateliers?: ReadonlyArray<MemberAtelier> }> = []
  ) {
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

  private async caller(): Promise<string> {
    return (await this.getAuthToken()) ?? ''
  }

  async get(): Promise<IdentityResult<UserPreferences>> {
    const current = this.preferences.get(await this.caller())
    if (current === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)
    return { ok: true, value: current }
  }

  async update(patch: UpdatePreferencesInput): Promise<IdentityResult<UserPreferences>> {
    const token = await this.caller()
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

  async myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    const joined = this.ateliers.get(await this.caller())
    if (joined === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)
    return { ok: true, value: joined }
  }
}
