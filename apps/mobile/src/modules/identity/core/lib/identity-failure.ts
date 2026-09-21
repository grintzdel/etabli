import { errorCodeOf } from '@etabli/shared/http'

import type { IdentityFailureCode } from '../model/session'

const BY_CODE: Readonly<Record<string, IdentityFailureCode>> = {
  VALIDATION_FAILED: 'INVALID_INPUT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
}

export const identityFailureOf = (status: number, body: unknown): IdentityFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_INPUT'
  if (status === 401) return 'UNAUTHORIZED'
  return 'UNREACHABLE'
}
