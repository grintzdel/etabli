import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

import { IdGenerator, IdGeneratorCryptoLive } from './id-generator'

const takeUuid = Effect.provide(
  Effect.flatMap(IdGenerator, (generator) => generator.uuid),
  IdGeneratorCryptoLive
)

describe('IdGeneratorCryptoLive', () => {
  it('produces a v4 uuid', async () => {
    const id = await Effect.runPromise(takeUuid)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('produces distinct values', async () => {
    const [first, second] = await Effect.runPromise(Effect.all([takeUuid, takeUuid]))
    expect(first).not.toBe(second)
  })
})
