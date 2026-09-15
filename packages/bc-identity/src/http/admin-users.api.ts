import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { AdminUser as AdminUserContract } from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { ForbiddenError } from '@etabli/shared/errors'
import { UserId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { AdminSelfLockoutError, UserUnknownError } from '../domain/errors'
import { AdminUserSchema, AdminUsersParamsSchema, UpdateAdminUserSchema } from '../domain/user.schema'

export const adminUserContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AdminUserSchema>,
  AdminUserContract
> = true

export const adminUsersApiGroup = HttpApiGroup.make('adminUsers')
  .add(
    HttpApiEndpoint.get('listUsers', routes.admin.users)
      .setUrlParams(AdminUsersParamsSchema)
      .addSuccess(Schema.Array(AdminUserSchema))
  )
  .add(
    HttpApiEndpoint.patch('updateUser', routes.admin.user)
      .setPath(Schema.Struct({ id: UserId }))
      .setPayload(UpdateAdminUserSchema)
      .addSuccess(AdminUserSchema)
      .addError(UserUnknownError)
      .addError(AdminSelfLockoutError)
  )
  .addError(ForbiddenError)
  .middleware(AuthMiddleware)
