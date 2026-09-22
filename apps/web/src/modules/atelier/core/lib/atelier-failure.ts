import { errorCodeOf } from '@etabli/api-client'
import { ApiErrorCode } from '@etabli/contract'

import type { AtelierFailureCode } from '../model/atelier'

const BY_CODE: Readonly<Partial<Record<ApiErrorCode, AtelierFailureCode>>> = {
  [ApiErrorCode.VALIDATION_FAILED]: 'INVALID_FILTER',
  [ApiErrorCode.ATELIER_NOT_FOUND]: 'NOT_FOUND',
  [ApiErrorCode.ATELIER_UNKNOWN]: 'NOT_FOUND',
  [ApiErrorCode.MACHINE_UNKNOWN]: 'NOT_FOUND',
  [ApiErrorCode.ATELIER_SLUG_TAKEN]: 'SLUG_TAKEN',
  [ApiErrorCode.UNAUTHORIZED]: 'UNAUTHORIZED',
  [ApiErrorCode.FORBIDDEN]: 'FORBIDDEN',
}

const mapped = (body: unknown): AtelierFailureCode | undefined => {
  const code = errorCodeOf(body)
  return code === undefined ? undefined : BY_CODE[code as ApiErrorCode]
}

export const atelierFailureOf = (status: number, body: unknown): AtelierFailureCode => {
  const known = mapped(body)
  if (known !== undefined) return known
  if (status === 404) return 'NOT_FOUND'
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401 || status === 403) return 'UNAUTHORIZED'
  return 'UNREACHABLE'
}

export const adminAtelierFailureOf = (status: number, body: unknown): AtelierFailureCode => {
  const known = mapped(body)
  if (known !== undefined) return known
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'SLUG_TAKEN'
  return 'UNREACHABLE'
}

export const manageMachineFailureOf = (status: number, body: unknown): AtelierFailureCode => {
  const known = mapped(body)
  if (known !== undefined) return known
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  return 'UNREACHABLE'
}
