import { z } from 'zod'

import { STATS_PERIODS } from '../../domain/constants/booking.constant.ts'

export const statsQuerySchema = z.object({ period: z.enum(STATS_PERIODS).optional() }).strict()

export type StatsQuery = z.infer<typeof statsQuerySchema>
