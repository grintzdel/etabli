import { z } from 'zod'

export const machineAvailabilityQuerySchema = z
  .object({
    from: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
  })
  .strict()

export type MachineAvailabilityQuery = z.infer<typeof machineAvailabilityQuerySchema>
