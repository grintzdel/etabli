import { z } from 'zod'

export const checkInBookingBodySchema = z.object({ nfcTagId: z.string().trim().min(1, 'Tag NFC illisible') }).strict()

export type CheckInBookingBody = z.infer<typeof checkInBookingBodySchema>
