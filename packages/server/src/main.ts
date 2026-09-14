import { NodeRuntime } from '@effect/platform-node'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { AppConfig } from './config/config'
import { makeHttpLive, ServerInfrastructureLayer } from './layers/http-live'

const port = Number(process.env['PORT'] ?? 3001)

const HttpLive = makeHttpLive({ port, infrastructure: ServerInfrastructureLayer })

const program = Effect.gen(function* () {
  const config = yield* AppConfig
  yield* Effect.log(`Etabli server starting (env=${config.env}, port=${port})`)
}).pipe(Effect.zipRight(Layer.launch(HttpLive)))

NodeRuntime.runMain(program)
