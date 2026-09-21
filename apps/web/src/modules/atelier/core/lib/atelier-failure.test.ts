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
  ])('reads the status %i', (status, expected) => {
    expect(atelierFailureOf(status)).toBe(expected)
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
  ])('reads the status %i', (status, expected) => {
    expect(adminAtelierFailureOf(status)).toBe(expected)
  })

  it('separates a forbidden admin page from an expired session', () => {
    expect(adminAtelierFailureOf(403)).not.toBe(adminAtelierFailureOf(401))
  })
})

describe('manageMachineFailureOf', () => {
  it('translates a tag already worn by another machine', () => {
    expect(manageMachineFailureOf(409, { code: ApiErrorCode.MACHINE_NFC_TAG_TAKEN })).toBe('NFC_TAG_TAKEN')
  })

  it('prefers the body code over the status', () => {
    expect(manageMachineFailureOf(404, { code: ApiErrorCode.MACHINE_NFC_TAG_TAKEN })).toBe('NFC_TAG_TAKEN')
  })

  it.each([
    [400, 'INVALID_FILTER'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'NFC_TAG_TAKEN'],
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
