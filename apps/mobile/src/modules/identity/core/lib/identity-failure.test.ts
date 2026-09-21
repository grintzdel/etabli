import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import type { IdentityFailureCode } from '../model/session'
import { identityFailureOf } from './identity-failure'

const MAPPED: ReadonlyArray<readonly [ApiErrorCode, IdentityFailureCode]> = [
  [ApiErrorCode.VALIDATION_FAILED, 'INVALID_INPUT'],
  [ApiErrorCode.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS'],
  [ApiErrorCode.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED'],
  [ApiErrorCode.UNAUTHORIZED, 'UNAUTHORIZED'],
]

describe('identityFailureOf', () => {
  it.each(MAPPED)('translates %s', (code, expected) => {
    expect(identityFailureOf(401, { code })).toBe(expected)
  })

  it('separates a suspended account from wrong credentials, both on a 401', () => {
    expect(identityFailureOf(401, { code: ApiErrorCode.ACCOUNT_SUSPENDED })).toBe('ACCOUNT_SUSPENDED')
    expect(identityFailureOf(401, { code: ApiErrorCode.INVALID_CREDENTIALS })).toBe('INVALID_CREDENTIALS')
  })

  it.each([
    [400, 'INVALID_INPUT'],
    [401, 'UNAUTHORIZED'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(identityFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(identityFailureOf(0, null)).toBe('UNREACHABLE')
  })

  it('reads a code it does not know as unreachable', () => {
    expect(identityFailureOf(500, { code: 'ACCOUNT_SOMETHING_NEW' })).toBe('UNREACHABLE')
  })
})
