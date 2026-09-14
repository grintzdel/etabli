import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class MachineNotBookableError extends Schema.TaggedError<MachineNotBookableError>()(
  'MachineNotBookableError',
  { machineId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class BookingOverlapError extends Schema.TaggedError<BookingOverlapError>()(
  'BookingOverlapError',
  { machineId: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}
