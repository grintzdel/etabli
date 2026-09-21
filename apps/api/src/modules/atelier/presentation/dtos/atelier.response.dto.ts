import { z } from 'zod'

import { MACHINE_KINDS, MACHINE_STATUSES } from '../../../machine/domain/constants/machine.constant.ts'
import { ATELIER_STATUSES } from '../../domain/constants/atelier.constant.ts'
import type {
  AdminAtelier,
  AtelierDetail,
  AtelierSummary,
  PublicMachine,
} from '../../domain/entities/atelier.entity.ts'

export const atelierSummaryResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  machineCount: z.int(),
  machineKinds: z.array(z.enum(MACHINE_KINDS)),
  distanceKm: z.number().nullable(),
})
export type AtelierSummaryResponse = z.infer<typeof atelierSummaryResponseSchema>

export const publicMachineResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  kind: z.enum(MACHINE_KINDS),
  requiresCertification: z.boolean(),
  slotDurationMinutes: z.int(),
  status: z.enum(MACHINE_STATUSES),
})

export const atelierDetailResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  machines: z.array(publicMachineResponseSchema),
})
export type AtelierDetailResponse = z.infer<typeof atelierDetailResponseSchema>

export const adminAtelierResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  city: z.string(),
  status: z.enum(ATELIER_STATUSES),
  machineCount: z.int(),
  createdAt: z.iso.datetime(),
})
export type AdminAtelierResponse = z.infer<typeof adminAtelierResponseSchema>

export const toAtelierSummaryResponse = (atelier: AtelierSummary): AtelierSummaryResponse => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  description: atelier.description,
  city: atelier.city,
  country: atelier.country,
  latitude: atelier.latitude,
  longitude: atelier.longitude,
  machineCount: atelier.machineCount,
  machineKinds: [...atelier.machineKinds],
  distanceKm: atelier.distanceKm,
})

const toPublicMachineResponse = (machine: PublicMachine) => ({
  id: machine.id,
  name: machine.name,
  description: machine.description,
  kind: machine.kind,
  requiresCertification: machine.requiresCertification,
  slotDurationMinutes: machine.slotDurationMinutes,
  status: machine.status,
})

export const toAtelierDetailResponse = (atelier: AtelierDetail): AtelierDetailResponse => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  description: atelier.description,
  street: atelier.street,
  postalCode: atelier.postalCode,
  city: atelier.city,
  country: atelier.country,
  latitude: atelier.latitude,
  longitude: atelier.longitude,
  machines: atelier.machines.map(toPublicMachineResponse),
})

export const toAdminAtelierResponse = (atelier: AdminAtelier): AdminAtelierResponse => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  city: atelier.city,
  status: atelier.status,
  machineCount: atelier.machineCount,
  createdAt: atelier.createdAt.toISOString(),
})
