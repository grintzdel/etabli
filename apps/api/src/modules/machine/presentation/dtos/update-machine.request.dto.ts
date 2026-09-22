import { z } from 'zod'

import { MACHINE_STATUSES, MAX_SLOT_MINUTES, MIN_SLOT_MINUTES } from '../../domain/constants/machine.constant.ts'

export const updateMachineBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    status: z.enum(MACHINE_STATUSES).optional(),
    requiresCertification: z.boolean().optional(),
    slotDurationMinutes: z.number().int().min(MIN_SLOT_MINUTES).max(MAX_SLOT_MINUTES).optional(),
  })
  .strict()

export type UpdateMachineBody = z.infer<typeof updateMachineBodySchema>
