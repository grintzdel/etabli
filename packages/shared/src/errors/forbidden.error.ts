import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()(
  'ForbiddenError',
  { reason: Schema.String },
  HttpApiSchema.annotations({ status: 403 })
) {}
