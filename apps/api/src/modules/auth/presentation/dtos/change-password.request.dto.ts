import { z } from 'zod'

import { passwordSchema } from './register.request.dto.ts'

export const changePasswordBodySchema = z.object({ currentPassword: z.string(), newPassword: passwordSchema }).strict()

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>
