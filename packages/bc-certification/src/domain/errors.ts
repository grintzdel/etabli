import { HttpApiSchema } from '@effect/platform'
import * as Schema from 'effect/Schema'

export class MachineNotCertifiableError extends Schema.TaggedError<MachineNotCertifiableError>()(
  'MachineNotCertifiableError',
  { machineId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class CertificationAlreadyRequestedError extends Schema.TaggedError<CertificationAlreadyRequestedError>()(
  'CertificationAlreadyRequestedError',
  { machineId: Schema.String },
  HttpApiSchema.annotations({ status: 409 })
) {}

export class CertificationUnknownError extends Schema.TaggedError<CertificationUnknownError>()(
  'CertificationUnknownError',
  { certificationId: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}
