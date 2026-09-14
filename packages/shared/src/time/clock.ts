import * as Context from 'effect/Context'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export interface ClockService {
  readonly now: Effect.Effect<DateTime.Utc>
}

export class Clock extends Context.Tag('@etabli/Clock')<Clock, ClockService>() {}

export const ClockSystemLive = Layer.succeed(Clock, Clock.of({ now: Effect.sync(() => DateTime.unsafeNow()) }))
