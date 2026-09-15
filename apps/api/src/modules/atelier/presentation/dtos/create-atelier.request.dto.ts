import { z } from 'zod'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugSchema = z.string().trim().toLowerCase().regex(SLUG_PATTERN, 'Identifiant d’URL invalide')

export const createAtelierBodySchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1, 'Le nom est obligatoire'),
    description: z.string().trim().default(''),
    street: z.string().trim().default(''),
    postalCode: z.string().trim().default(''),
    city: z.string().trim().min(1, 'La ville est obligatoire'),
    country: z.string().trim().min(1).default('FR'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict()

export type CreateAtelierBody = z.infer<typeof createAtelierBodySchema>
