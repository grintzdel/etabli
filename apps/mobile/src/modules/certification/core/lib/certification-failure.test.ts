import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import { certificationFailureOf } from './certification-failure'

describe('certificationFailureOf', () => {
  it('translates a request that is not the caller own', () => {
    expect(certificationFailureOf(404, { code: ApiErrorCode.CERTIFICATION_UNKNOWN })).toBe('CERTIFICATION_UNKNOWN')
  })

  it('prefers the body code over the status', () => {
    expect(certificationFailureOf(409, { code: ApiErrorCode.CERTIFICATION_UNKNOWN })).toBe('CERTIFICATION_UNKNOWN')
  })

  it.each([
    [401, 'UNAUTHORIZED'],
    [404, 'NOT_CERTIFIABLE'],
    [409, 'ALREADY_REQUESTED'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(certificationFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(certificationFailureOf(0, null)).toBe('UNREACHABLE')
  })

  it('reads a code it does not know as unreachable', () => {
    expect(certificationFailureOf(500, { code: 'CERTIFICATION_SOMETHING_NEW' })).toBe('UNREACHABLE')
  })
})
