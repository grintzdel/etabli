import { z } from 'zod'

import { MAX_PRACTICES } from '../../domain/constants/user.constant.ts'

export const practiceSchema = z
  .array(z.string().trim().min(1, 'Une pratique ne peut pas être vide'))
  .min(1, 'Déclarez au moins une pratique')
  .max(MAX_PRACTICES, `Douze pratiques au plus`)

export const updateProfileBodySchema = z
  .object({
    displayName: z.string().trim().min(1, 'Le nom affiché est obligatoire').optional(),
    practice: practiceSchema.optional(),
  })
  .strict()

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>
