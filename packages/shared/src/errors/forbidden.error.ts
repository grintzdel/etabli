import * as Schema from 'effect/Schema'

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()('ForbiddenError', {
  reason: Schema.String,
}) {}
