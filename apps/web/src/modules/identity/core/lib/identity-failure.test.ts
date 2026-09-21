import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import { IdentityFailureCode } from '../model/session'
import { identityFailureOf } from './identity-failure'

const MAPPED: ReadonlyArray<readonly [ApiErrorCode, IdentityFailureCode]> = [
  [ApiErrorCode.EMAIL_ALREADY_TAKEN, IdentityFailureCode.EMAIL_TAKEN],
  [ApiErrorCode.INVALID_CREDENTIALS, IdentityFailureCode.INVALID_CREDENTIALS],
  [ApiErrorCode.ACCOUNT_SUSPENDED, IdentityFailureCode.ACCOUNT_SUSPENDED],
  [ApiErrorCode.UNAUTHORIZED, IdentityFailureCode.UNAUTHORIZED],
  [ApiErrorCode.PREFERRED_ATELIER_NOT_JOINED, IdentityFailureCode.PREFERRED_ATELIER_NOT_JOINED],
  [ApiErrorCode.FORBIDDEN, IdentityFailureCode.FORBIDDEN],
  [ApiErrorCode.USER_UNKNOWN, IdentityFailureCode.USER_UNKNOWN],
  [ApiErrorCode.ADMIN_SELF_LOCKOUT, IdentityFailureCode.SELF_LOCKOUT],
  [ApiErrorCode.VALIDATION_FAILED, IdentityFailureCode.INVALID_INPUT],
]

describe('identityFailureOf', () => {
  it.each(MAPPED)('translates %s', (code, expected) => {
    expect(identityFailureOf(409, { code })).toBe(expected)
  })

  it('separates a suspended account from wrong credentials, both on a 401', () => {
    expect(identityFailureOf(401, { code: ApiErrorCode.ACCOUNT_SUSPENDED })).toBe(IdentityFailureCode.ACCOUNT_SUSPENDED)
    expect(identityFailureOf(401, { code: ApiErrorCode.INVALID_CREDENTIALS })).toBe(
      IdentityFailureCode.INVALID_CREDENTIALS
    )
  })

  it.each([
    [400, IdentityFailureCode.INVALID_INPUT],
    [401, IdentityFailureCode.UNAUTHORIZED],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(identityFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(identityFailureOf(0, null)).toBe(IdentityFailureCode.UNREACHABLE)
  })

  it('reads a code it does not know as unreachable', () => {
    expect(identityFailureOf(500, { code: 'ACCOUNT_SOMETHING_NEW' })).toBe(IdentityFailureCode.UNREACHABLE)
  })
})
