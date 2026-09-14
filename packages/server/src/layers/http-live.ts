import { createServer } from 'node:http'

import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import * as Layer from 'effect/Layer'

import { ApiLive } from './api-live'
import { MigratorLive } from './migrator.layer'
import { SqlClientLive } from './sql-client.layer'

export interface MakeHttpLiveOptions {
  readonly port: number
  readonly infrastructure: Layer.Layer<never, unknown, never>
  readonly withMigrator?: boolean
}

export const ServerInfrastructureLayer = Layer.mergeAll(SqlClientLive)

export const makeHttpLive = ({ port, infrastructure, withMigrator = true }: MakeHttpLiveOptions) => {
  const base = HttpApiBuilder.serve().pipe(
    Layer.provide(ApiLive),
    HttpServer.withLogAddress,
    Layer.provide(NodeHttpServer.layer(() => createServer(), { port }))
  )

  const migrated = withMigrator ? base.pipe(Layer.provide(MigratorLive)) : base

  return migrated.pipe(Layer.provide(infrastructure))
}
