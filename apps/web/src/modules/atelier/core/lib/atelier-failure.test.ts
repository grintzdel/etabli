import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

import { adminAtelierFailureOf, atelierFailureOf, manageMachineFailureOf } from './atelier-failure'

describe('atelierFailureOf', () => {
  it.each([
    [400, 'INVALID_FILTER'],
    [401, 'UNAUTHORIZED'],
    [403, 'UNAUTHORIZED'],
    [404, 'NOT_FOUND'],
    [0, 'UNREACHABLE'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(atelierFailureOf(status, {})).toBe(expected)
  })

  it('prefers the body code over the status', () => {
    expect(atelierFailureOf(500, { code: ApiErrorCode.ATELIER_NOT_FOUND })).toBe('NOT_FOUND')
  })

  it('reads a machine the api does not know as a missing atelier page', () => {
    expect(atelierFailureOf(500, { code: ApiErrorCode.MACHINE_UNKNOWN })).toBe('NOT_FOUND')
  })
})

describe('adminAtelierFailureOf', () => {
  it.each([
    [400, 'INVALID_FILTER'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'SLUG_TAKEN'],
    [0, 'UNREACHABLE'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(adminAtelierFailureOf(status, {})).toBe(expected)
  })

  it('prefers the body code over the status', () => {
    expect(adminAtelierFailureOf(500, { code: ApiErrorCode.ATELIER_SLUG_TAKEN })).toBe('SLUG_TAKEN')
  })

  it('separates a forbidden admin page from an expired session', () => {
    expect(adminAtelierFailureOf(403, {})).not.toBe(adminAtelierFailureOf(401, {}))
  })
})

describe('manageMachineFailureOf', () => {
  it('prefers the body code over the status', () => {
    expect(manageMachineFailureOf(500, { code: ApiErrorCode.MACHINE_UNKNOWN })).toBe('NOT_FOUND')
  })

  it.each([
    [400, 'INVALID_FILTER'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
  ])('falls back on the status %i when the body names no code', (status, expected) => {
    expect(manageMachineFailureOf(status, {})).toBe(expected)
  })

  it('reads an unreachable api as unreachable', () => {
    expect(manageMachineFailureOf(0, null)).toBe('UNREACHABLE')
  })

  it('reads a code it does not know as unreachable', () => {
    expect(manageMachineFailureOf(500, { code: 'MACHINE_SOMETHING_NEW' })).toBe('UNREACHABLE')
  })
})
