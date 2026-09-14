import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { ManagedParc as ManagedParcContract } from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { ForbiddenError } from '@etabli/shared/errors'
import { MachineId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { CreateMachineSchema, MachineSchema, ManagedParcSchema, UpdateMachineSchema } from '../domain/atelier.schema'
import { MachineUnknownError } from '../domain/errors'

export const managedParcContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof ManagedParcSchema>,
  ManagedParcContract
> = true

export const manageApiGroup = HttpApiGroup.make('manage')
  .add(HttpApiEndpoint.get('listParcs', routes.manage.machines).addSuccess(Schema.Array(ManagedParcSchema)))
  .add(
    HttpApiEndpoint.post('createMachine', routes.manage.machines)
      .setPayload(CreateMachineSchema)
      .addSuccess(MachineSchema, { status: 201 })
      .addError(ForbiddenError)
  )
  .add(
    HttpApiEndpoint.patch('updateMachine', routes.manage.machine)
      .setPath(Schema.Struct({ id: MachineId }))
      .setPayload(UpdateMachineSchema)
      .addSuccess(MachineSchema)
      .addError(MachineUnknownError)
  )
  .middleware(AuthMiddleware)
