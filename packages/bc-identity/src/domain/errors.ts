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

export class PreferredAtelierNotJoinedError extends Schema.TaggedError<PreferredAtelierNotJoinedError>()(
  'PreferredAtelierNotJoinedError',
  { atelierId: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}

export class UserUnknownError extends Schema.TaggedError<UserUnknownError>()(
  'UserUnknownError',
  { userId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class AdminSelfLockoutError extends Schema.TaggedError<AdminSelfLockoutError>()(
  'AdminSelfLockoutError',
  {},
  HttpApiSchema.annotations({ status: 409 })
) {}
