import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { AdminAtelier as AdminAtelierContract } from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { ForbiddenError } from '@etabli/shared/errors'
import { AtelierId, UserId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import {
  AdminAtelierSchema,
  CreateAtelierSchema,
  MembershipSchema,
  SetAtelierStatusSchema,
  SetMembershipRoleSchema,
} from '../domain/atelier.schema'
import { AtelierSlugTakenError, AtelierUnknownError, MembershipUnknownError } from '../domain/errors'

export const adminAtelierContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AdminAtelierSchema>,
  AdminAtelierContract
> = true

export const adminApiGroup = HttpApiGroup.make('admin')
  .add(HttpApiEndpoint.get('listAteliers', routes.admin.ateliers).addSuccess(Schema.Array(AdminAtelierSchema)))
  .add(
    HttpApiEndpoint.post('createAtelier', routes.admin.ateliers)
      .setPayload(CreateAtelierSchema)
      .addSuccess(AdminAtelierSchema, { status: 201 })
      .addError(AtelierSlugTakenError)
  )
  .add(
    HttpApiEndpoint.patch('setAtelierStatus', routes.admin.atelier)
      .setPath(Schema.Struct({ id: AtelierId }))
      .setPayload(SetAtelierStatusSchema)
      .addSuccess(AdminAtelierSchema)
      .addError(AtelierUnknownError)
  )
  .add(
    HttpApiEndpoint.patch('setMembershipRole', routes.admin.atelierMember)
      .setPath(Schema.Struct({ atelierId: AtelierId, userId: UserId }))
      .setPayload(SetMembershipRoleSchema)
      .addSuccess(MembershipSchema)
      .addError(MembershipUnknownError)
  )
  .addError(ForbiddenError)
  .middleware(AuthMiddleware)
