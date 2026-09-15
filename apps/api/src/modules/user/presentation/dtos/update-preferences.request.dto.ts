import { z } from 'zod'

import { Theme } from '../../domain/constants/preferences.constant.ts'

export const themeSchema = z.enum([Theme.DARK, Theme.LIGHT, Theme.SYSTEM])

export const updatePreferencesBodySchema = z
  .object({
    theme: themeSchema.optional(),
    defaultAtelierId: z.uuid('Atelier inconnu').nullable().optional(),
  })
  .strict()

export type UpdatePreferencesBody = z.infer<typeof updatePreferencesBodySchema>
