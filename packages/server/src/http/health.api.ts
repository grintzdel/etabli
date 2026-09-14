import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { HealthResponse } from '@etabli/contract'
import { routes } from '@etabli/contract'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

export const HealthResponseSchema = Schema.Struct({
  ok: Schema.Boolean,
  version: Schema.String,
  uptimeMs: Schema.Number,
})

export const healthContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof HealthResponseSchema>,
  HealthResponse
> = true

export const healthApiGroup = HttpApiGroup.make('health').add(
  HttpApiEndpoint.get('check', routes.health).addSuccess(HealthResponseSchema)
)
