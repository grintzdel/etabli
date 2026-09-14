import { HttpApiBuilder, HttpServer } from '@effect/platform'
import * as Layer from 'effect/Layer'

import { ApiLive } from '../src/layers/api-live'
import { ServerInfrastructureLayer } from '../src/layers/http-live'

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(Layer.provide(ServerInfrastructureLayer))
)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
