import { sendApiRequest, UNREACHABLE, type ApiRequest } from '../../../shared/core/http/api-client'
import { errorCodeOf } from '../../../shared/core/http/error-code'
import { AtelierFailureCode, failure, type AtelierResult } from '../model/atelier'

const BY_CODE: Readonly<Record<string, AtelierFailureCode>> = {
  VALIDATION_FAILED: AtelierFailureCode.INVALID_FILTER,
  ATELIER_NOT_FOUND: AtelierFailureCode.NOT_FOUND,
  ATELIER_UNKNOWN: AtelierFailureCode.NOT_FOUND,
  MACHINE_UNKNOWN: AtelierFailureCode.NOT_FOUND,
  UNAUTHORIZED: AtelierFailureCode.UNAUTHORIZED,
}

export const codeOf = (status: number, body: unknown): AtelierFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return AtelierFailureCode.INVALID_FILTER
  if (status === 401) return AtelierFailureCode.UNAUTHORIZED
  if (status === 404) return AtelierFailureCode.NOT_FOUND
  return AtelierFailureCode.UNREACHABLE
}

export const requestAtelier = async <A>(
  baseUrl: string,
  path: string,
  request: ApiRequest = {}
): Promise<AtelierResult<A>> => {
  const { status, body } = await sendApiRequest(baseUrl, path, request)
  if (status === UNREACHABLE) return failure(AtelierFailureCode.UNREACHABLE)
  if (status >= 400) return failure(codeOf(status, body))
  return { ok: true, value: body as A }
}
