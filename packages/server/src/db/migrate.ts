import { NodeRuntime } from '@effect/platform-node'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { MigratorLive } from '../layers/migrator.layer'
import { SqlClientLive } from '../layers/sql-client.layer'

const program = Effect.log('Migrations applied').pipe(
  Effect.provide(MigratorLive.pipe(Layer.provide(SqlClientLive)))
) as unknown as Effect.Effect<void, unknown, never>

NodeRuntime.runMain(program)
