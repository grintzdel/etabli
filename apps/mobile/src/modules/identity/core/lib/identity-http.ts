import { sendApiRequest, UNREACHABLE, type ApiRequest } from '../../../shared/core/http/api-client'
import { errorCodeOf } from '../../../shared/core/http/error-code'
import { failure, IdentityFailureCode, type IdentityResult } from '../model/session'

const BY_CODE: Readonly<Record<string, IdentityFailureCode>> = {
  VALIDATION_FAILED: IdentityFailureCode.INVALID_INPUT,
  INVALID_CREDENTIALS: IdentityFailureCode.INVALID_CREDENTIALS,
  ACCOUNT_SUSPENDED: IdentityFailureCode.ACCOUNT_SUSPENDED,
  UNAUTHORIZED: IdentityFailureCode.UNAUTHORIZED,
  InvalidCredentialsError: IdentityFailureCode.INVALID_CREDENTIALS,
  AccountSuspendedError: IdentityFailureCode.ACCOUNT_SUSPENDED,
  UnauthorizedError: IdentityFailureCode.UNAUTHORIZED,
}

export const codeOf = (status: number, body: unknown): IdentityFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return IdentityFailureCode.INVALID_INPUT
  if (status === 401) return IdentityFailureCode.UNAUTHORIZED
  return IdentityFailureCode.UNREACHABLE
}

export const requestIdentity = async <A>(
  baseUrl: string,
  path: string,
  request: ApiRequest = {}
): Promise<IdentityResult<A>> => {
  const { status, body } = await sendApiRequest(baseUrl, path, request)
  if (status === UNREACHABLE) return failure(IdentityFailureCode.UNREACHABLE)
  if (status >= 400) return failure(codeOf(status, body))
  return { ok: true, value: body as A }
}
