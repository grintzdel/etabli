import type { ChangePasswordInput, UpdateProfileInput } from '../model/profile'
import type { Account, CurrentUser, IdentityResult, LoginInput, RegisterInput, Session } from '../model/session'
import { failure, IdentityFailureCode } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

export class IdentityInMemoryAdapter implements IIdentityPort {
  private readonly accounts = new Map<string, Account>()
  private readonly tokens = new Map<string, string>()
  private counter = 0

  private session(account: Account): Session {
    this.counter += 1
    const token = `token-${this.counter}`
    this.tokens.set(token, account.user.email)
    return { token, expiresAt: new Date(Date.now() + 604_800_000).toISOString(), user: account.user }
  }

  async register(input: RegisterInput): Promise<IdentityResult<Session>> {
    const email = input.email.trim().toLowerCase()
    if (this.accounts.has(email)) return failure(IdentityFailureCode.EMAIL_TAKEN)

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
    if (account === undefined || account.password !== input.password) {
      return failure(IdentityFailureCode.INVALID_CREDENTIALS)
    }
    return { ok: true, value: this.session(account) }
  }

  async me(token: string): Promise<IdentityResult<CurrentUser>> {
    const account = this.accountOf(token)
    if (account === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)
    return { ok: true, value: account.user }
  }

  async updateProfile(token: string, patch: UpdateProfileInput): Promise<IdentityResult<CurrentUser>> {
    const account = this.accountOf(token)
    if (account === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)

    account.user = {
      ...account.user,
      displayName: patch.displayName ?? account.user.displayName,
      practice: patch.practice ?? account.user.practice,
    }
    return { ok: true, value: account.user }
  }

  async changePassword(token: string, input: ChangePasswordInput): Promise<IdentityResult<Session>> {
    const account = this.accountOf(token)
    if (account === undefined) return failure(IdentityFailureCode.UNAUTHORIZED)
    if (account.password !== input.currentPassword) return failure(IdentityFailureCode.INVALID_CREDENTIALS)

    account.password = input.newPassword
    return { ok: true, value: this.session(account) }
  }

  private accountOf(token: string): Account | undefined {
    const email = this.tokens.get(token)
    return email === undefined ? undefined : this.accounts.get(email)
  }
}
