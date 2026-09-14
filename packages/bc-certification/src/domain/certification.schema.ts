import { AtelierId, CertificationId, MachineId, UserId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

import { CertificationStatus } from './certification.constants'

export const CertificationStatusSchema = Schema.Literal(
  CertificationStatus.PENDING,
  CertificationStatus.GRANTED,
  CertificationStatus.REVOKED
)

export const CertificationSchema = Schema.Struct({
  id: CertificationId,
  userId: UserId,
  machineId: MachineId,
  status: CertificationStatusSchema,
  requestedAt: Schema.DateTimeUtc,
  decidedAt: Schema.NullOr(Schema.DateTimeUtc),
  decidedBy: Schema.NullOr(UserId),
})
export type Certification = Schema.Schema.Type<typeof CertificationSchema>

export const RequestCertificationSchema = Schema.Struct({ machineId: MachineId })
export type RequestCertification = Schema.Schema.Type<typeof RequestCertificationSchema>

export const MyCertificationStatusSchema = Schema.Literal(
  'NONE',
  CertificationStatus.PENDING,
  CertificationStatus.GRANTED,
  CertificationStatus.REVOKED
)
export type MyCertificationStatus = Schema.Schema.Type<typeof MyCertificationStatusSchema>

export const MyCertificationSchema = Schema.Struct({
  certificationId: Schema.NullOr(CertificationId),
  machineId: MachineId,
  machineName: Schema.String,
  atelierId: AtelierId,
  atelierName: Schema.String,
  atelierSlug: Schema.String,
  status: MyCertificationStatusSchema,
  requestedAt: Schema.NullOr(Schema.DateTimeUtc),
  decidedAt: Schema.NullOr(Schema.DateTimeUtc),
})
export type MyCertification = Schema.Schema.Type<typeof MyCertificationSchema>

export const CertificationRequestSchema = Schema.Struct({
  id: CertificationId,
  userId: UserId,
  memberName: Schema.String,
  machineId: MachineId,
  machineName: Schema.String,
  atelierId: AtelierId,
  atelierName: Schema.String,
  status: CertificationStatusSchema,
  requestedAt: Schema.DateTimeUtc,
  decidedAt: Schema.NullOr(Schema.DateTimeUtc),
})
export type CertificationRequest = Schema.Schema.Type<typeof CertificationRequestSchema>
