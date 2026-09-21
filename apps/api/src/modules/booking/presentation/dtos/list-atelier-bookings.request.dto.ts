import { z } from 'zod'

import { BOOKING_STATUSES } from '../../domain/constants/booking.constant.ts'

export const listAtelierBookingsQuerySchema = z
  .object({
    date: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
    status: z.enum(BOOKING_STATUSES).optional(),
  })
  .strict()

export type ListAtelierBookingsQuery = z.infer<typeof listAtelierBookingsQuerySchema>
