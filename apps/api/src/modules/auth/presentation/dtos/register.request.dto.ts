import { z } from 'zod'

import { PASSWORD_MIN_LENGTH } from '../../domain/constants/auth.constant.ts'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Adresse e-mail invalide')

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Le mot de passe fait au moins ${PASSWORD_MIN_LENGTH} caractères`)

export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(1, 'Le nom affiché est obligatoire'),
  })
  .strict()

export type RegisterBody = z.infer<typeof registerBodySchema>
