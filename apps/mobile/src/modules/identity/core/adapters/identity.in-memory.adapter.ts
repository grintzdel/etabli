import type { AuthTokenProvider } from '@etabli/api-client'

import type {
  Account,
  CurrentUser,
  IdentityResult,
  LoginInput,
  MemberAtelier,
  RegisterInput,
  Session,
} from '../model/session'
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

  async register(input: RegisterInput): Promise<IdentityResult<Session>> {
    const email = input.email.trim().toLowerCase()
    if (this.accounts.has(email)) return failure('EMAIL_TAKEN')

    const account: Account = {
      password: input.password,
      user: {
        id: `00000000-0000-4000-8000-${String(this.accounts.size).padStart(12, '0')}`,
        email,
        displayName: input.displayName,
        platformRole: 'MEMBER',
        practice: [],
        onboardingCompletedAt: null,
        memberships: [],
        createdAt: new Date().toISOString(),
      },
    }
    this.accounts.set(email, account)
    return { ok: true, value: this.session(account) }
  }

  async login(input: LoginInput): Promise<IdentityResult<Session>> {
    const account = this.accounts.get(input.email.trim().toLowerCase())
    if (account === undefined || account.password !== input.password) return failure('INVALID_CREDENTIALS')
    if (account.suspended === true) return failure('ACCOUNT_SUSPENDED')

    return { ok: true, value: this.session(account) }
  }

  private session(account: Account): Session {
    this.counter += 1
    const token = `token-${this.counter}`
    this.tokens.set(token, account.user.email.toLowerCase())
    return { token, expiresAt: new Date(Date.now() + 604_800_000).toISOString(), user: account.user }
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
