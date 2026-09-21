import { ApiErrorCode } from '@etabli/contract'
import { errorCodeOf } from '@etabli/shared/http'

import { IdentityFailureCode } from '../model/session'

const BY_CODE: Readonly<Partial<Record<ApiErrorCode, IdentityFailureCode>>> = {
  [ApiErrorCode.EMAIL_ALREADY_TAKEN]: IdentityFailureCode.EMAIL_TAKEN,
  [ApiErrorCode.INVALID_CREDENTIALS]: IdentityFailureCode.INVALID_CREDENTIALS,
  [ApiErrorCode.ACCOUNT_SUSPENDED]: IdentityFailureCode.ACCOUNT_SUSPENDED,
  [ApiErrorCode.UNAUTHORIZED]: IdentityFailureCode.UNAUTHORIZED,
  [ApiErrorCode.PREFERRED_ATELIER_NOT_JOINED]: IdentityFailureCode.PREFERRED_ATELIER_NOT_JOINED,
  [ApiErrorCode.FORBIDDEN]: IdentityFailureCode.FORBIDDEN,
  [ApiErrorCode.USER_UNKNOWN]: IdentityFailureCode.USER_UNKNOWN,
  [ApiErrorCode.ADMIN_SELF_LOCKOUT]: IdentityFailureCode.SELF_LOCKOUT,
  [ApiErrorCode.VALIDATION_FAILED]: IdentityFailureCode.INVALID_INPUT,
}

export const identityFailureOf = (status: number, body: unknown): IdentityFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code as ApiErrorCode]
  if (mapped !== undefined) return mapped
  if (status === 400) return IdentityFailureCode.INVALID_INPUT
  if (status === 401) return IdentityFailureCode.UNAUTHORIZED
  return IdentityFailureCode.UNREACHABLE
}
