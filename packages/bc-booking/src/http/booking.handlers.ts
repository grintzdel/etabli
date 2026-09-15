import type { BookingId, MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { cancelAtelierBooking } from '../application/commands/cancel-atelier-booking/cancel-atelier-booking.command'
import { cancelBooking } from '../application/commands/cancel-booking/cancel-booking.command'
import { checkInBooking } from '../application/commands/check-in-booking/check-in-booking.command'
import { createBooking } from '../application/commands/create-booking/create-booking.command'
import { manualCheckInBooking } from '../application/commands/manual-check-in-booking/manual-check-in-booking.command'
import { markNoShow } from '../application/commands/mark-no-show/mark-no-show.command'
import { getAtelierStats } from '../application/queries/get-atelier-stats/get-atelier-stats.query'
import { getBookingDetail } from '../application/queries/get-booking-detail/get-booking-detail.query'
import { getMachineAvailability } from '../application/queries/get-machine-availability/get-machine-availability.query'
import { getNetworkStats } from '../application/queries/get-network-stats/get-network-stats.query'
import { listAtelierBookings } from '../application/queries/list-atelier-bookings/list-atelier-bookings.query'
import { listMyBookings } from '../application/queries/list-my-bookings/list-my-bookings.query'
import type {
  AtelierBookingsParams,
  AtelierStatsParams,
  AvailabilityParams,
  CheckInBooking,
  CreateBooking,
} from '../domain/booking.schema'

export const bookingHandlers = {
  availability: ({
    path,
    urlParams,
  }: {
    readonly path: { readonly id: MachineId }
    readonly urlParams: AvailabilityParams
  }) => getMachineAvailability(path.id, urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  create: ({ payload }: { readonly payload: CreateBooking }) =>
    createBooking(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  list: () => listMyBookings().pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  getById: ({ path }: { readonly path: { readonly id: BookingId } }) =>
    getBookingDetail(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  cancel: ({ path }: { readonly path: { readonly id: BookingId } }) =>
    cancelBooking(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  checkIn: ({ path, payload }: { readonly path: { readonly id: BookingId }; readonly payload: CheckInBooking }) =>
    checkInBooking(path.id, payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}

export const bookingManagementHandlers = {
  list: ({ urlParams }: { readonly urlParams: AtelierBookingsParams }) =>
    listAtelierBookings(urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  checkIn: ({ path }: { readonly path: { readonly id: BookingId } }) =>
    manualCheckInBooking(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  markNoShow: ({ path }: { readonly path: { readonly id: BookingId } }) =>
    markNoShow(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  cancel: ({ path }: { readonly path: { readonly id: BookingId } }) =>
    cancelAtelierBooking(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  stats: ({ urlParams }: { readonly urlParams: AtelierStatsParams }) =>
    getAtelierStats(urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}

export const networkStatsHandlers = {
  stats: ({ urlParams }: { readonly urlParams: AtelierStatsParams }) =>
    getNetworkStats(urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
