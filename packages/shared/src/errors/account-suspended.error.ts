import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class AccountSuspendedError extends Schema.TaggedError<AccountSuspendedError>()(
  'AccountSuspendedError',
  {},
  HttpApiSchema.annotations({ status: 403 })
) {}
