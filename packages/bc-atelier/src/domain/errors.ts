import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class AtelierNotFoundError extends Schema.TaggedError<AtelierNotFoundError>()(
  'AtelierNotFoundError',
  { slug: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class AtelierNotJoinableError extends Schema.TaggedError<AtelierNotJoinableError>()(
  'AtelierNotJoinableError',
  { atelierId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}
