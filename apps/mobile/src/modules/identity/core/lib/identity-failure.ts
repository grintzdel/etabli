import { errorCodeOf } from '@etabli/api-client'
import { ApiErrorCode } from '@etabli/contract'

import type { IdentityFailureCode } from '../model/session'

const BY_CODE: Readonly<Partial<Record<ApiErrorCode, IdentityFailureCode>>> = {
  [ApiErrorCode.VALIDATION_FAILED]: 'INVALID_INPUT',
  [ApiErrorCode.INVALID_CREDENTIALS]: 'INVALID_CREDENTIALS',
  [ApiErrorCode.ACCOUNT_SUSPENDED]: 'ACCOUNT_SUSPENDED',
  [ApiErrorCode.UNAUTHORIZED]: 'UNAUTHORIZED',
}

export const identityFailureOf = (status: number, body: unknown): IdentityFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code as ApiErrorCode]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_INPUT'
  if (status === 401) return 'UNAUTHORIZED'
  return 'UNREACHABLE'
}
