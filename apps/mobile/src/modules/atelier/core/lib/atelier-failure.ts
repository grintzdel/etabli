import { ApiErrorCode } from '@etabli/contract'
import { errorCodeOf } from '@etabli/shared/http'

import type { AtelierFailureCode } from '../model/atelier'

const BY_CODE: Readonly<Partial<Record<ApiErrorCode, AtelierFailureCode>>> = {
  [ApiErrorCode.VALIDATION_FAILED]: 'INVALID_FILTER',
  [ApiErrorCode.ATELIER_NOT_FOUND]: 'NOT_FOUND',
  [ApiErrorCode.ATELIER_UNKNOWN]: 'NOT_FOUND',
  [ApiErrorCode.MACHINE_UNKNOWN]: 'NOT_FOUND',
  [ApiErrorCode.UNAUTHORIZED]: 'UNAUTHORIZED',
}

export const atelierFailureOf = (status: number, body: unknown): AtelierFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code as ApiErrorCode]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  return 'UNREACHABLE'
}
