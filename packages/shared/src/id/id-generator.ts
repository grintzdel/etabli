import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export interface IdGeneratorService {
  readonly uuid: Effect.Effect<string>
}

export class IdGenerator extends Context.Tag('@etabli/IdGenerator')<IdGenerator, IdGeneratorService>() {}

export const IdGeneratorCryptoLive = Layer.succeed(
  IdGenerator,
  IdGenerator.of({ uuid: Effect.sync(() => globalThis.crypto.randomUUID()) })
)
