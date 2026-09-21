import { errorCodeOf } from '@etabli/shared/http'

import type { AtelierFailureCode } from '../model/atelier'

const BY_CODE: Readonly<Record<string, AtelierFailureCode>> = {
  VALIDATION_FAILED: 'INVALID_FILTER',
  ATELIER_NOT_FOUND: 'NOT_FOUND',
  ATELIER_UNKNOWN: 'NOT_FOUND',
  MACHINE_UNKNOWN: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
}

export const atelierFailureOf = (status: number, body: unknown): AtelierFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  return 'UNREACHABLE'
}
