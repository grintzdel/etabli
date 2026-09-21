import type { CurrentUser, IdentityResult, LoginInput, Session } from '../model/session'
import { failure } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

interface Account {
  readonly password: string
  readonly user: CurrentUser
  readonly suspended?: boolean
}

export class IdentityInMemoryAdapter implements IIdentityPort {
  private readonly accounts = new Map<string, Account>()
  private readonly tokens = new Map<string, string>()
  private counter = 0

  constructor(seed: ReadonlyArray<Account> = []) {
    for (const account of seed) this.accounts.set(account.user.email.toLowerCase(), account)
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

  async me(token: string): Promise<IdentityResult<CurrentUser>> {
    const email = this.tokens.get(token)
    const account = email === undefined ? undefined : this.accounts.get(email)
    if (account === undefined) return failure('UNAUTHORIZED')
    return { ok: true, value: account.user }
  }
}
