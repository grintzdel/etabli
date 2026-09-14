import * as Either from 'effect/Either'
import * as Schema from 'effect/Schema'
import { describe, expect, it } from 'vitest'

import { AtelierId, BookingId, CertificationId, MachineId, UserId } from './branded-ids'

const VALID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

describe('branded ids', () => {
  it('decodes a valid uuid', () => {
    expect(Either.isRight(Schema.decodeUnknownEither(UserId)(VALID))).toBe(true)
  })

  it('rejects a non-uuid', () => {
    expect(Either.isRight(Schema.decodeUnknownEither(UserId)('not-a-uuid'))).toBe(false)
  })

  it('rejects a number', () => {
    expect(Either.isRight(Schema.decodeUnknownEither(AtelierId)(42))).toBe(false)
  })

  it('exposes one brand per aggregate', () => {
    const decoders = [UserId, AtelierId, MachineId, CertificationId, BookingId]
    expect(decoders.every((schema) => Either.isRight(Schema.decodeUnknownEither(schema)(VALID)))).toBe(true)
  })
})
