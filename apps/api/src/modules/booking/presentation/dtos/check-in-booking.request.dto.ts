import { z } from 'zod'

export const checkInBookingBodySchema = z
  .object({ checkInToken: z.string().trim().min(1, 'QR code illisible') })
  .strict()

export type CheckInBookingBody = z.infer<typeof checkInBookingBodySchema>
