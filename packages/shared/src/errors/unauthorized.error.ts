import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
  'UnauthorizedError',
  { reason: Schema.String },
  HttpApiSchema.annotations({ status: 401 })
) {}
