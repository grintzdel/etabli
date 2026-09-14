import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { MachineAvailability as MachineAvailabilityContract } from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { MachineId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { AvailabilityParamsSchema, MachineAvailabilitySchema } from '../domain/booking.schema'
import { MachineNotBookableError } from '../domain/errors'

export const machineAvailabilityContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof MachineAvailabilitySchema>,
  MachineAvailabilityContract
> = true

export const bookingApiGroup = HttpApiGroup.make('booking')
  .add(
    HttpApiEndpoint.get('availability', routes.machines.availability)
      .setPath(Schema.Struct({ id: MachineId }))
      .setUrlParams(AvailabilityParamsSchema)
      .addSuccess(MachineAvailabilitySchema)
      .addError(MachineNotBookableError)
  )
  .middleware(AuthMiddleware)
