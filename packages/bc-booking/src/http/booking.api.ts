import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type {
  BookingDetail as BookingDetailContract,
  MachineAvailability as MachineAvailabilityContract,
} from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { BookingId, MachineId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import {
  AvailabilityParamsSchema,
  BookingDetailSchema,
  CreateBookingSchema,
  MachineAvailabilitySchema,
} from '../domain/booking.schema'
import {
  BookingNotCancellableError,
  BookingOverlapError,
  BookingUnknownError,
  MachineNotBookableError,
  MachineUnavailableError,
  MissingCertificationError,
  SlotInThePastError,
} from '../domain/errors'

export const machineAvailabilityContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof MachineAvailabilitySchema>,
  MachineAvailabilityContract
> = true

export const bookingDetailContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof BookingDetailSchema>,
  BookingDetailContract
> = true

export const bookingApiGroup = HttpApiGroup.make('booking')
  .add(
    HttpApiEndpoint.get('availability', routes.machines.availability)
      .setPath(Schema.Struct({ id: MachineId }))
      .setUrlParams(AvailabilityParamsSchema)
      .addSuccess(MachineAvailabilitySchema)
      .addError(MachineNotBookableError)
  )
  .add(
    HttpApiEndpoint.post('create', routes.bookings.create)
      .setPayload(CreateBookingSchema)
      .addSuccess(BookingDetailSchema, { status: 201 })
      .addError(MachineNotBookableError)
      .addError(MachineUnavailableError)
      .addError(MissingCertificationError)
      .addError(SlotInThePastError)
      .addError(BookingOverlapError)
  )
  .add(HttpApiEndpoint.get('list', routes.bookings.list).addSuccess(Schema.Array(BookingDetailSchema)))
  .add(
    HttpApiEndpoint.get('getById', routes.bookings.getById)
      .setPath(Schema.Struct({ id: BookingId }))
      .addSuccess(BookingDetailSchema)
      .addError(BookingUnknownError)
  )
  .add(
    HttpApiEndpoint.post('cancel', routes.bookings.cancel)
      .setPath(Schema.Struct({ id: BookingId }))
      .addSuccess(BookingDetailSchema)
      .addError(BookingUnknownError)
      .addError(BookingNotCancellableError)
  )
  .middleware(AuthMiddleware)
