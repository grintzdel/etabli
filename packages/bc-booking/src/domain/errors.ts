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

export class MissingCertificationError extends Schema.TaggedError<MissingCertificationError>()(
  'MissingCertificationError',
  { machineId: Schema.String },
  HttpApiSchema.annotations({ status: 403 })
) {}

export class MachineUnavailableError extends Schema.TaggedError<MachineUnavailableError>()(
  'MachineUnavailableError',
  { machineId: Schema.String, status: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}

export class SlotInThePastError extends Schema.TaggedError<SlotInThePastError>()(
  'SlotInThePastError',
  { machineId: Schema.String, startAt: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}

export class BookingUnknownError extends Schema.TaggedError<BookingUnknownError>()(
  'BookingUnknownError',
  { bookingId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class BookingNotCancellableError extends Schema.TaggedError<BookingNotCancellableError>()(
  'BookingNotCancellableError',
  { bookingId: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}
