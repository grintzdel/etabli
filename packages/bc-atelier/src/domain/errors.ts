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

export class AtelierUnknownError extends Schema.TaggedError<AtelierUnknownError>()(
  'AtelierUnknownError',
  { atelierId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class AtelierSlugTakenError extends Schema.TaggedError<AtelierSlugTakenError>()(
  'AtelierSlugTakenError',
  { slug: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}

export class MachineUnknownError extends Schema.TaggedError<MachineUnknownError>()(
  'MachineUnknownError',
  { machineId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class MachineNfcTagTakenError extends Schema.TaggedError<MachineNfcTagTakenError>()(
  'MachineNfcTagTakenError',
  { nfcTagId: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}
