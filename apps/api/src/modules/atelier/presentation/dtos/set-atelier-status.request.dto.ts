import { z } from 'zod'

import { ATELIER_STATUSES } from '../../domain/constants/atelier.constant.ts'

export const setAtelierStatusBodySchema = z.object({ status: z.enum(ATELIER_STATUSES) }).strict()

export type SetAtelierStatusBody = z.infer<typeof setAtelierStatusBodySchema>
