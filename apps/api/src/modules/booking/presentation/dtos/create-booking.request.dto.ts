import { z } from 'zod'

export const createBookingBodySchema = z
  .object({
    machineId: z.uuid('Machine inconnue'),
    startAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  })
  .strict()

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>
