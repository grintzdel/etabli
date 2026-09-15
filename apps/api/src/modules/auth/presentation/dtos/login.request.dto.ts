import { z } from 'zod'

import { emailSchema } from './register.request.dto.ts'

export const loginBodySchema = z.object({ email: emailSchema, password: z.string() }).strict()

export type LoginBody = z.infer<typeof loginBodySchema>
