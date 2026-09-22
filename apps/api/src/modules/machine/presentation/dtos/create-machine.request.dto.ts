import { z } from 'zod'

import {
  DEFAULT_SLOT_MINUTES,
  MACHINE_KINDS,
  MAX_SLOT_MINUTES,
  MIN_SLOT_MINUTES,
} from '../../domain/constants/machine.constant.ts'

export const createMachineBodySchema = z
  .object({
    atelierId: z.uuid('Atelier inconnu'),
    name: z.string().trim().min(1, 'Le nom de la machine est obligatoire'),
    description: z.string().trim().default(''),
    kind: z.enum(MACHINE_KINDS),
    requiresCertification: z.boolean().default(true),
    slotDurationMinutes: z.number().int().min(MIN_SLOT_MINUTES).max(MAX_SLOT_MINUTES).default(DEFAULT_SLOT_MINUTES),
  })
  .strict()

export type CreateMachineBody = z.infer<typeof createMachineBodySchema>
