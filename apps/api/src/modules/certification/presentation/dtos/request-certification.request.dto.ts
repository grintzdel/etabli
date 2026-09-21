import { z } from 'zod'

export const requestCertificationBodySchema = z.object({ machineId: z.uuid('Machine inconnue') }).strict()

export type RequestCertificationBody = z.infer<typeof requestCertificationBodySchema>
