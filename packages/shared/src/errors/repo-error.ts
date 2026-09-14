import * as Schema from 'effect/Schema'

export class RepoError extends Schema.TaggedError<RepoError>()('RepoError', {
  cause: Schema.Unknown,
  operation: Schema.String,
}) {}
