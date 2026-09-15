import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type {
  AtelierBooking as AtelierBookingContract,
  AtelierStats as AtelierStatsContract,
  NetworkStats as NetworkStatsContract,
  BookingDetail as BookingDetailContract,
  CheckInBooking as CheckInBookingContract,
  MachineAvailability as MachineAvailabilityContract,
} from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { ForbiddenError } from '@etabli/shared/errors'
import { BookingId, MachineId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import {
  AtelierBookingSchema,
  AtelierBookingsParamsSchema,
  AtelierStatsParamsSchema,
  AtelierStatsSchema,
  NetworkStatsSchema,
  AvailabilityParamsSchema,
  BookingDetailSchema,
  CheckInBookingSchema,
  CreateBookingSchema,
  MachineAvailabilitySchema,
} from '../domain/booking.schema'
import {
  BookingNotCancellableError,
  BookingNotCheckInableError,
  BookingNotMarkableAsNoShowError,
  BookingOverlapError,
  BookingUnknownError,
  CheckInWindowClosedError,
  MachineNotBookableError,
  MachineUnavailableError,
  MissingCertificationError,
  NfcTagMismatchError,
  SlotInThePastError,
} from '../domain/errors'

export const machineAvailabilityContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof MachineAvailabilitySchema>,
  MachineAvailabilityContract
> = true

export const atelierBookingContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AtelierBookingSchema>,
  AtelierBookingContract
> = true

export const atelierStatsContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AtelierStatsSchema>,
  AtelierStatsContract
> = true

export const networkStatsContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof NetworkStatsSchema>,
  NetworkStatsContract
> = true

export const bookingDetailContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof BookingDetailSchema>,
  BookingDetailContract
> = true

export const checkInBookingContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof CheckInBookingSchema>,
  CheckInBookingContract
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
  .add(
    HttpApiEndpoint.post('checkIn', routes.bookings.checkIn)
      .setPath(Schema.Struct({ id: BookingId }))
      .setPayload(CheckInBookingSchema)
      .addSuccess(BookingDetailSchema)
      .addError(BookingUnknownError)
      .addError(BookingNotCheckInableError)
      .addError(CheckInWindowClosedError)
      .addError(NfcTagMismatchError)
  )
  .middleware(AuthMiddleware)

export const bookingManagementApiGroup = HttpApiGroup.make('bookingManagement')
  .add(
    HttpApiEndpoint.get('list', routes.manage.bookings)
      .setUrlParams(AtelierBookingsParamsSchema)
      .addSuccess(Schema.Array(AtelierBookingSchema))
  )
  .add(
    HttpApiEndpoint.post('checkIn', routes.manage.checkInBooking)
      .setPath(Schema.Struct({ id: BookingId }))
      .addSuccess(AtelierBookingSchema)
      .addError(BookingUnknownError)
      .addError(BookingNotCheckInableError)
      .addError(CheckInWindowClosedError)
  )
  .add(
    HttpApiEndpoint.get('stats', routes.manage.stats)
      .setUrlParams(AtelierStatsParamsSchema)
      .addSuccess(Schema.Array(AtelierStatsSchema))
  )
  .add(
    HttpApiEndpoint.post('cancel', routes.manage.cancelBooking)
      .setPath(Schema.Struct({ id: BookingId }))
      .addSuccess(AtelierBookingSchema)
      .addError(BookingUnknownError)
      .addError(BookingNotCancellableError)
  )
  .add(
    HttpApiEndpoint.post('markNoShow', routes.manage.noShow)
      .setPath(Schema.Struct({ id: BookingId }))
      .addSuccess(AtelierBookingSchema)
      .addError(BookingUnknownError)
      .addError(BookingNotMarkableAsNoShowError)
  )
  .middleware(AuthMiddleware)

export const networkStatsApiGroup = HttpApiGroup.make('networkStats')
  .add(
    HttpApiEndpoint.get('stats', routes.admin.stats)
      .setUrlParams(AtelierStatsParamsSchema)
      .addSuccess(NetworkStatsSchema)
  )
  .addError(ForbiddenError)
  .middleware(AuthMiddleware)
