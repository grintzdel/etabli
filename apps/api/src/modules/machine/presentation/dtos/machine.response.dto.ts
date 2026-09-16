import { z } from 'zod'

import { ATELIER_STATUSES } from '../../../atelier/domain/constants/atelier.constant.ts'
import { MACHINE_KINDS, MACHINE_STATUSES } from '../../domain/constants/machine.constant.ts'
import type { MachineEntity, MachineWithAtelier, ManagedParc } from '../../domain/entities/machine.entity.ts'

export const machineResponseSchema = z.object({
  id: z.uuid(),
  atelierId: z.uuid(),
  name: z.string(),
  description: z.string(),
  kind: z.enum(MACHINE_KINDS),
  requiresCertification: z.boolean(),
  slotDurationMinutes: z.int(),
  status: z.enum(MACHINE_STATUSES),
  nfcTagId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type MachineResponse = z.infer<typeof machineResponseSchema>

export const machineDetailResponseSchema = z.object({
  id: z.uuid(),
  atelierId: z.uuid(),
  atelierName: z.string(),
  atelierSlug: z.string(),
  name: z.string(),
  description: z.string(),
  kind: z.enum(MACHINE_KINDS),
  requiresCertification: z.boolean(),
  slotDurationMinutes: z.int(),
  status: z.enum(MACHINE_STATUSES),
})
export type MachineDetailResponse = z.infer<typeof machineDetailResponseSchema>

export const managedParcResponseSchema = z.object({
  atelier: z.object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    status: z.enum(ATELIER_STATUSES),
  }),
  machines: z.array(machineResponseSchema),
})
export type ManagedParcResponse = z.infer<typeof managedParcResponseSchema>

export const toMachineResponse = (machine: MachineEntity): MachineResponse => ({
  id: machine.id,
  atelierId: machine.atelierId,
  name: machine.name,
  description: machine.description,
  kind: machine.kind,
  requiresCertification: machine.requiresCertification,
  slotDurationMinutes: machine.slotDurationMinutes,
  status: machine.status,
  nfcTagId: machine.nfcTagId,
  createdAt: machine.createdAt.toISOString(),
  updatedAt: machine.updatedAt.toISOString(),
})

export const toMachineDetailResponse = (machine: MachineWithAtelier): MachineDetailResponse => ({
  id: machine.id,
  atelierId: machine.atelierId,
  atelierName: machine.atelierName,
  atelierSlug: machine.atelierSlug,
  name: machine.name,
  description: machine.description,
  kind: machine.kind,
  requiresCertification: machine.requiresCertification,
  slotDurationMinutes: machine.slotDurationMinutes,
  status: machine.status,
})

export const toManagedParcResponse = (parc: ManagedParc): ManagedParcResponse => ({
  atelier: {
    id: parc.atelier.id,
    slug: parc.atelier.slug,
    name: parc.atelier.name,
    status: parc.atelier.status,
  },
  machines: parc.machines.map(toMachineResponse),
})
