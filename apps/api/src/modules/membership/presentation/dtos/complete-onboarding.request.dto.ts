import { z } from 'zod'

import { practiceSchema } from '../../../user/presentation/dtos/update-profile.request.dto.ts'

export const completeOnboardingBodySchema = z
  .object({ atelierId: z.uuid('Atelier inconnu'), practice: practiceSchema })
  .strict()

export type CompleteOnboardingBody = z.infer<typeof completeOnboardingBodySchema>
