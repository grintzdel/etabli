import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

import { Clock, ClockSystemLive } from './clock'

describe('ClockSystemLive', () => {
  it('returns an instant close to the wall clock', async () => {
    const before = Date.now()
    const now = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(Clock, (clock) => clock.now),
        ClockSystemLive
      )
    )
    const after = Date.now()
    const millis = DateTime.toEpochMillis(now)

    expect(millis).toBeGreaterThanOrEqual(before)
    expect(millis).toBeLessThanOrEqual(after)
  })
})
