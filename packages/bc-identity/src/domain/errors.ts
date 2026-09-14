import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class EmailAlreadyTakenError extends Schema.TaggedError<EmailAlreadyTakenError>()(
  'EmailAlreadyTakenError',
  { email: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}

export class InvalidCredentialsError extends Schema.TaggedError<InvalidCredentialsError>()(
  'InvalidCredentialsError',
  {},
  HttpApiSchema.annotations({ status: 401 })
) {}

export class AccountSuspendedError extends Schema.TaggedError<AccountSuspendedError>()(
  'AccountSuspendedError',
  {},
  HttpApiSchema.annotations({ status: 403 })
) {}
