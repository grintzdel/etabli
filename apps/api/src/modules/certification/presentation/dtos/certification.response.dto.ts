import { z } from 'zod'

import { CERTIFICATION_STATUSES, MY_CERTIFICATION_STATUSES } from '../../domain/constants/certification.constant.ts'
import type {
  CertificationEntity,
  CertificationRequest,
  MyCertification,
} from '../../domain/entities/certification.entity.ts'

export const certificationResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  machineId: z.uuid(),
  status: z.enum(CERTIFICATION_STATUSES),
  requestedAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable(),
  decidedBy: z.uuid().nullable(),
})
export type CertificationResponse = z.infer<typeof certificationResponseSchema>

export const myCertificationResponseSchema = z.object({
  certificationId: z.uuid().nullable(),
  machineId: z.uuid(),
  machineName: z.string(),
  atelierId: z.uuid(),
  atelierName: z.string(),
  atelierSlug: z.string(),
  status: z.enum(MY_CERTIFICATION_STATUSES),
  requestedAt: z.iso.datetime().nullable(),
  decidedAt: z.iso.datetime().nullable(),
})
export type MyCertificationResponse = z.infer<typeof myCertificationResponseSchema>

export const certificationRequestResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  memberName: z.string(),
  machineId: z.uuid(),
  machineName: z.string(),
  atelierId: z.uuid(),
  atelierName: z.string(),
  status: z.enum(CERTIFICATION_STATUSES),
  requestedAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable(),
})
export type CertificationRequestResponse = z.infer<typeof certificationRequestResponseSchema>

export const toCertificationResponse = (certification: CertificationEntity): CertificationResponse => ({
  id: certification.id,
  userId: certification.userId,
  machineId: certification.machineId,
  status: certification.status,
  requestedAt: certification.requestedAt.toISOString(),
  decidedAt: certification.decidedAt?.toISOString() ?? null,
  decidedBy: certification.decidedBy,
})

export const toMyCertificationResponse = (certification: MyCertification): MyCertificationResponse => ({
  certificationId: certification.certificationId,
  machineId: certification.machineId,
  machineName: certification.machineName,
  atelierId: certification.atelierId,
  atelierName: certification.atelierName,
  atelierSlug: certification.atelierSlug,
  status: certification.status,
  requestedAt: certification.requestedAt?.toISOString() ?? null,
  decidedAt: certification.decidedAt?.toISOString() ?? null,
})

export const toCertificationRequestResponse = (request: CertificationRequest): CertificationRequestResponse => ({
  id: request.id,
  userId: request.userId,
  memberName: request.memberName,
  machineId: request.machineId,
  machineName: request.machineName,
  atelierId: request.atelierId,
  atelierName: request.atelierName,
  status: request.status,
  requestedAt: request.requestedAt.toISOString(),
  decidedAt: request.decidedAt?.toISOString() ?? null,
})
