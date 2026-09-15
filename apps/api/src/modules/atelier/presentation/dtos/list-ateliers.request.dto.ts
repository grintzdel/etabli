import { z } from 'zod'

import { MACHINE_KINDS } from '../../../machine/domain/constants/machine.constant.ts'
import { DIRECTORY_MAX_PAGE_SIZE, DIRECTORY_PAGE_SIZE } from '../../domain/constants/atelier.constant.ts'

export const listAteliersQuerySchema = z
  .object({
    city: z.string().trim().min(1).optional(),
    machineKind: z.enum(MACHINE_KINDS).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().optional(),
    limit: z.coerce.number().int().min(1).max(DIRECTORY_MAX_PAGE_SIZE).default(DIRECTORY_PAGE_SIZE),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict()
  .refine((query) => [query.lat, query.lng, query.radiusKm].filter((value) => value !== undefined).length % 3 === 0, {
    message: 'lat, lng et radiusKm vont ensemble',
  })

export type ListAteliersQuery = z.infer<typeof listAteliersQuerySchema>
