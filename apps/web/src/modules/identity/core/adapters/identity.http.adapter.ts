import { routes } from '@etabli/contract'

import type { CurrentUser, IdentityResult, LoginInput, RegisterInput, Session } from '../model/session'
import { failure, IdentityFailureCode } from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

const TAG_TO_CODE: Readonly<Record<string, IdentityFailureCode>> = {
  EmailAlreadyTakenError: IdentityFailureCode.EMAIL_TAKEN,
  InvalidCredentialsError: IdentityFailureCode.INVALID_CREDENTIALS,
  AccountSuspendedError: IdentityFailureCode.ACCOUNT_SUSPENDED,
  UnauthorizedError: IdentityFailureCode.UNAUTHORIZED,
}

const codeOf = (status: number, body: unknown): IdentityFailureCode => {
  const tag = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)['_tag'] : undefined
  if (typeof tag === 'string' && tag in TAG_TO_CODE) return TAG_TO_CODE[tag] as IdentityFailureCode
  if (status === 400) return IdentityFailureCode.INVALID_INPUT
  if (status === 401) return IdentityFailureCode.UNAUTHORIZED
  return IdentityFailureCode.UNREACHABLE
}

export class IdentityHttpAdapter implements IIdentityPort {
  constructor(private readonly baseUrl: string) {}

  private async call<A>(path: string, init: RequestInit): Promise<IdentityResult<A>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, cache: 'no-store' })
    } catch {
      return failure(IdentityFailureCode.UNREACHABLE)
    }

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) return failure(codeOf(response.status, body))
    return { ok: true, value: body as A }
  }

  register(input: RegisterInput): Promise<IdentityResult<Session>> {
    return this.call<Session>(routes.auth.register, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return this.call<Session>(routes.auth.login, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  }

  me(token: string): Promise<IdentityResult<CurrentUser>> {
    return this.call<CurrentUser>(routes.auth.me, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })
  }
}
