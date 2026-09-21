import { errorCodeOf } from '@etabli/shared/http'

import { IdentityFailureCode } from '../model/session'

const BY_CODE: Readonly<Record<string, IdentityFailureCode>> = {
  EMAIL_ALREADY_TAKEN: IdentityFailureCode.EMAIL_TAKEN,
  INVALID_CREDENTIALS: IdentityFailureCode.INVALID_CREDENTIALS,
  ACCOUNT_SUSPENDED: IdentityFailureCode.ACCOUNT_SUSPENDED,
  UNAUTHORIZED: IdentityFailureCode.UNAUTHORIZED,
  PREFERRED_ATELIER_NOT_JOINED: IdentityFailureCode.PREFERRED_ATELIER_NOT_JOINED,
  FORBIDDEN: IdentityFailureCode.FORBIDDEN,
  USER_UNKNOWN: IdentityFailureCode.USER_UNKNOWN,
  ADMIN_SELF_LOCKOUT: IdentityFailureCode.SELF_LOCKOUT,
  VALIDATION_FAILED: IdentityFailureCode.INVALID_INPUT,
}

export const identityFailureOf = (status: number, body: unknown): IdentityFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return IdentityFailureCode.INVALID_INPUT
  if (status === 401) return IdentityFailureCode.UNAUTHORIZED
  return IdentityFailureCode.UNREACHABLE
}
