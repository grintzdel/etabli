import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class AtelierNotFoundError extends Schema.TaggedError<AtelierNotFoundError>()(
  'AtelierNotFoundError',
  { slug: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}
