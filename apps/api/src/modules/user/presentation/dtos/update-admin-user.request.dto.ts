import { z } from 'zod'

import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UserStatus } from '../../domain/constants/user.constant.ts'

export const updateAdminUserBodySchema = z
  .object({
    platformRole: z.enum([PlatformRole.MEMBER, PlatformRole.PLATFORM_ADMIN]).optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED]).optional(),
  })
  .strict()

export type UpdateAdminUserBody = z.infer<typeof updateAdminUserBodySchema>
