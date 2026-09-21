import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import type { AtelierFailureCode } from '../model/atelier'
import { atelierFailureOf } from './atelier-failure'

const MAPPED: ReadonlyArray<readonly [ApiErrorCode, AtelierFailureCode]> = [
  [ApiErrorCode.VALIDATION_FAILED, 'INVALID_FILTER'],
  [ApiErrorCode.ATELIER_NOT_FOUND, 'NOT_FOUND'],
  [ApiErrorCode.ATELIER_UNKNOWN, 'NOT_FOUND'],
  [ApiErrorCode.MACHINE_UNKNOWN, 'NOT_FOUND'],
  [ApiErrorCode.UNAUTHORIZED, 'UNAUTHORIZED'],
]

describe('atelierFailureOf', () => {
  it.each(MAPPED)('translates %s', (code, expected) => {
    expect(atelierFailureOf(404, { code })).toBe(expected)
  })

  it('prefers the body code over the status', () => {
    expect(atelierFailureOf(404, { code: ApiErrorCode.VALIDATION_FAILED })).toBe('INVALID_FILTER')
  })

  it.each([
    [400, 'INVALID_FILTER'],
    [401, 'UNAUTHORIZED'],
    [404, 'NOT_FOUND'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(atelierFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(atelierFailureOf(0, null)).toBe('UNREACHABLE')
  })

  it('reads a code it does not know as unreachable', () => {
    expect(atelierFailureOf(500, { code: 'ATELIER_SOMETHING_NEW' })).toBe('UNREACHABLE')
  })
})
