import { errorCodeOf } from '@etabli/api-client'
import { ApiErrorCode } from '@etabli/contract'

import type { AtelierFailureCode } from '../model/atelier'

export const atelierFailureOf = (status: number): AtelierFailureCode => {
  if (status === 404) return 'NOT_FOUND'
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401 || status === 403) return 'UNAUTHORIZED'
  return 'UNREACHABLE'
}

export const adminAtelierFailureOf = (status: number): AtelierFailureCode => {
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'SLUG_TAKEN'
  return 'UNREACHABLE'
}

export const manageMachineFailureOf = (status: number, body: unknown): AtelierFailureCode => {
  if (errorCodeOf(body) === ApiErrorCode.MACHINE_NFC_TAG_TAKEN) return 'NFC_TAG_TAKEN'
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'NFC_TAG_TAKEN'
  return 'UNREACHABLE'
}
