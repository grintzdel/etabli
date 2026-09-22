import type { AuthTokenProvider } from '@etabli/api-client'

import type { Account, CurrentUser, IdentityResult, LoginInput, MemberAtelier, Session } from '../model/session'
import { failure } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityInMemoryAdapter implements IIdentityPort {
  private readonly accounts = new Map<string, Account>()
  private readonly tokens = new Map<string, string>()
  private readonly ateliers = new Map<string, ReadonlyArray<MemberAtelier>>()
  private counter = 0

  constructor(
    private readonly getAuthToken: AuthTokenProvider,
    seed: ReadonlyArray<Account> = []
  ) {
    for (const account of seed) this.accounts.set(account.user.email.toLowerCase(), account)
  }

  seedAteliers(email: string, ateliers: ReadonlyArray<MemberAtelier>): void {
    this.ateliers.set(email.toLowerCase(), ateliers)
  }

  async login(input: LoginInput): Promise<IdentityResult<Session>> {
    const account = this.accounts.get(input.email.trim().toLowerCase())
    if (account === undefined || account.password !== input.password) return failure('INVALID_CREDENTIALS')
    if (account.suspended === true) return failure('ACCOUNT_SUSPENDED')

    this.counter += 1
    const token = `token-${this.counter}`
    this.tokens.set(token, account.user.email.toLowerCase())

    return {
      ok: true,
      value: { token, expiresAt: new Date(Date.now() + 604_800_000).toISOString(), user: account.user },
    }
  }

  async me(): Promise<IdentityResult<CurrentUser>> {
    const token = await this.getAuthToken()
    const email = token === null || token === undefined ? undefined : this.tokens.get(token)
    const account = email === undefined ? undefined : this.accounts.get(email)
    if (account === undefined) return failure('UNAUTHORIZED')
    return { ok: true, value: account.user }
  }

  async myAteliers(): Promise<IdentityResult<ReadonlyArray<MemberAtelier>>> {
    const mine = await this.me()
    if (!mine.ok) return mine
    return { ok: true, value: this.ateliers.get(mine.value.email.toLowerCase()) ?? [] }
  }
}
