import { describe, expect, it } from 'vitest'

import type { MyCertificationStatus } from './certification'
import { isRequestable } from './certification'

describe('isRequestable', () => {
  it.each<[MyCertificationStatus, boolean]>([
    ['NONE', true],
    ['REVOKED', true],
    ['PENDING', false],
    ['GRANTED', false],
  ])('reads %s as requestable: %s', (status, expected) => {
    expect(isRequestable(status)).toBe(expected)
  })
})
