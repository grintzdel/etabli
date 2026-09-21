import { errorCodeOf } from '@etabli/shared/http'

import type { CertificationFailureCode } from '../model/certification'

export const certificationFailureOf = (status: number, body: unknown): CertificationFailureCode => {
  if (errorCodeOf(body) === 'CERTIFICATION_UNKNOWN') return 'CERTIFICATION_UNKNOWN'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_CERTIFIABLE'
  if (status === 409) return 'ALREADY_REQUESTED'
  return 'UNREACHABLE'
}
