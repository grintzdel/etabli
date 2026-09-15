import { z } from 'zod'

import { currentUserResponseSchema, toCurrentUserResponse } from '../../../user/presentation/dtos/user.response.dto.ts'
import type { Session } from '../../domain/entities/session.entity.ts'

export const sessionResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime(),
  user: currentUserResponseSchema,
})
export type SessionResponse = z.infer<typeof sessionResponseSchema>

export const toSessionResponse = (session: Session): SessionResponse => ({
  token: session.token,
  expiresAt: session.expiresAt.toISOString(),
  user: toCurrentUserResponse(session.user),
})
