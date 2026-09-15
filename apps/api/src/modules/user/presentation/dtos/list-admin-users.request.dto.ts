import { z } from 'zod'

import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UserStatus } from '../../domain/constants/user.constant.ts'

export const listAdminUsersQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    platformRole: z.enum([PlatformRole.MEMBER, PlatformRole.PLATFORM_ADMIN]).optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED]).optional(),
  })
  .strict()

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>
