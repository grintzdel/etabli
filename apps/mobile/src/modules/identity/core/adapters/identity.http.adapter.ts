import { routes } from '@etabli/contract'
import { createApiClient, errorCodeOf, type ApiClient } from '@etabli/shared/http'

import {
  FAILURE_MESSAGES,
  type CurrentUser,
  type IdentityFailureCode,
  type IdentityResult,
  type LoginInput,
  type Session,
} from '../model/session'
import type { IIdentityPort } from '../ports/identity.port'

const BY_CODE: Readonly<Record<string, IdentityFailureCode>> = {
  VALIDATION_FAILED: 'INVALID_INPUT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  InvalidCredentialsError: 'INVALID_CREDENTIALS',
  AccountSuspendedError: 'ACCOUNT_SUSPENDED',
  UnauthorizedError: 'UNAUTHORIZED',
}

const failureOf = (status: number, body: unknown): IdentityFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_INPUT'
  if (status === 401) return 'UNAUTHORIZED'
  return 'UNREACHABLE'
}

export class IdentityHttpAdapter implements IIdentityPort {
  private readonly http: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf })
  }

  login(input: LoginInput): Promise<IdentityResult<Session>> {
    return this.http.call<Session>(routes.auth.login, { method: 'POST', body: input })
  }

  me(token: string): Promise<IdentityResult<CurrentUser>> {
    return this.http.call<CurrentUser>(routes.auth.me, { token })
  }
}
