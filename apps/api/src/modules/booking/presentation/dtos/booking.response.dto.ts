import { z } from 'zod'

import { MACHINE_STATUSES } from '../../../machine/domain/constants/machine.constant.ts'
import {
  BOOKING_STATUSES,
  CHECK_IN_METHODS,
  SLOT_REASONS,
  STATS_PERIODS,
} from '../../domain/constants/booking.constant.ts'
import type { AtelierStats, MachineUsage, NetworkStats } from '../../domain/entities/atelier-stats.entity.ts'
import type { AvailabilitySlot, MachineAvailability } from '../../domain/entities/availability.entity.ts'
import type { AtelierBooking, BookingDetail } from '../../domain/entities/booking-read-model.ts'

export const bookingDetailResponseSchema = z.object({
  id: z.uuid(),
  machineId: z.uuid(),
  machineName: z.string(),
  atelierId: z.uuid(),
  atelierName: z.string(),
  atelierSlug: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  status: z.enum(BOOKING_STATUSES),
  checkedInAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  canCancel: z.boolean(),
  canCheckIn: z.boolean(),
})
export type BookingDetailResponse = z.infer<typeof bookingDetailResponseSchema>

export const atelierBookingResponseSchema = z.object({
  id: z.uuid(),
  machineId: z.uuid(),
  machineName: z.string(),
  atelierId: z.uuid(),
  atelierName: z.string(),
  userId: z.uuid(),
  memberName: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  status: z.enum(BOOKING_STATUSES),
  checkedInAt: z.iso.datetime().nullable(),
  checkedInVia: z.enum(CHECK_IN_METHODS).nullable(),
  canCheckIn: z.boolean(),
  canMarkNoShow: z.boolean(),
  canCancel: z.boolean(),
})
export type AtelierBookingResponse = z.infer<typeof atelierBookingResponseSchema>

export const availabilitySlotResponseSchema = z.object({
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  available: z.boolean(),
  reason: z.enum(SLOT_REASONS),
})

export const machineAvailabilityResponseSchema = z.object({
  machineId: z.uuid(),
  machineName: z.string(),
  atelierId: z.uuid(),
  atelierName: z.string(),
  atelierSlug: z.string(),
  machineStatus: z.enum(MACHINE_STATUSES),
  requiresCertification: z.boolean(),
  slotDurationMinutes: z.int(),
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  slots: z.array(availabilitySlotResponseSchema),
})
export type MachineAvailabilityResponse = z.infer<typeof machineAvailabilityResponseSchema>

export const machineUsageResponseSchema = z.object({
  machineId: z.uuid(),
  machineName: z.string(),
  bookings: z.int(),
  bookedHours: z.number(),
  occupancyRate: z.number(),
  noShows: z.int(),
})

export const atelierStatsResponseSchema = z.object({
  atelierId: z.uuid(),
  atelierName: z.string(),
  period: z.enum(STATS_PERIODS),
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  openHours: z.number(),
  bookings: z.int(),
  bookedHours: z.number(),
  consumedHours: z.number(),
  noShows: z.int(),
  cancellations: z.int(),
  occupancyRate: z.number(),
  machines: z.array(machineUsageResponseSchema),
})
export type AtelierStatsResponse = z.infer<typeof atelierStatsResponseSchema>

export const networkStatsResponseSchema = z.object({
  period: z.enum(STATS_PERIODS),
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  ateliers: z.int(),
  machines: z.int(),
  openHours: z.number(),
  bookings: z.int(),
  bookedHours: z.number(),
  consumedHours: z.number(),
  noShows: z.int(),
  cancellations: z.int(),
  occupancyRate: z.number(),
  byAtelier: z.array(atelierStatsResponseSchema),
})
export type NetworkStatsResponse = z.infer<typeof networkStatsResponseSchema>

export const toBookingDetailResponse = (booking: BookingDetail): BookingDetailResponse => ({
  id: booking.id,
  machineId: booking.machineId,
  machineName: booking.machineName,
  atelierId: booking.atelierId,
  atelierName: booking.atelierName,
  atelierSlug: booking.atelierSlug,
  startAt: booking.startAt.toISOString(),
  endAt: booking.endAt.toISOString(),
  status: booking.status,
  checkedInAt: booking.checkedInAt?.toISOString() ?? null,
  cancelledAt: booking.cancelledAt?.toISOString() ?? null,
  canCancel: booking.canCancel,
  canCheckIn: booking.canCheckIn,
})

export const toAtelierBookingResponse = (booking: AtelierBooking): AtelierBookingResponse => ({
  id: booking.id,
  machineId: booking.machineId,
  machineName: booking.machineName,
  atelierId: booking.atelierId,
  atelierName: booking.atelierName,
  userId: booking.userId,
  memberName: booking.memberName,
  startAt: booking.startAt.toISOString(),
  endAt: booking.endAt.toISOString(),
  status: booking.status,
  checkedInAt: booking.checkedInAt?.toISOString() ?? null,
  checkedInVia: booking.checkedInVia,
  canCheckIn: booking.canCheckIn,
  canMarkNoShow: booking.canMarkNoShow,
  canCancel: booking.canCancel,
})

const toAvailabilitySlotResponse = (slot: AvailabilitySlot) => ({
  startAt: slot.startAt.toISOString(),
  endAt: slot.endAt.toISOString(),
  available: slot.available,
  reason: slot.reason,
})

export const toMachineAvailabilityResponse = (availability: MachineAvailability): MachineAvailabilityResponse => ({
  machineId: availability.machineId,
  machineName: availability.machineName,
  atelierId: availability.atelierId,
  atelierName: availability.atelierName,
  atelierSlug: availability.atelierSlug,
  machineStatus: availability.machineStatus,
  requiresCertification: availability.requiresCertification,
  slotDurationMinutes: availability.slotDurationMinutes,
  from: availability.from.toISOString(),
  to: availability.to.toISOString(),
  slots: availability.slots.map(toAvailabilitySlotResponse),
})

const toMachineUsageResponse = (usage: MachineUsage) => ({
  machineId: usage.machineId,
  machineName: usage.machineName,
  bookings: usage.bookings,
  bookedHours: usage.bookedHours,
  occupancyRate: usage.occupancyRate,
  noShows: usage.noShows,
})

export const toAtelierStatsResponse = (stats: AtelierStats): AtelierStatsResponse => ({
  atelierId: stats.atelierId,
  atelierName: stats.atelierName,
  period: stats.period,
  from: stats.from.toISOString(),
  to: stats.to.toISOString(),
  openHours: stats.openHours,
  bookings: stats.bookings,
  bookedHours: stats.bookedHours,
  consumedHours: stats.consumedHours,
  noShows: stats.noShows,
  cancellations: stats.cancellations,
  occupancyRate: stats.occupancyRate,
  machines: stats.machines.map(toMachineUsageResponse),
})

export const toNetworkStatsResponse = (stats: NetworkStats): NetworkStatsResponse => ({
  period: stats.period,
  from: stats.from.toISOString(),
  to: stats.to.toISOString(),
  ateliers: stats.ateliers,
  machines: stats.machines,
  openHours: stats.openHours,
  bookings: stats.bookings,
  bookedHours: stats.bookedHours,
  consumedHours: stats.consumedHours,
  noShows: stats.noShows,
  cancellations: stats.cancellations,
  occupancyRate: stats.occupancyRate,
  byAtelier: stats.byAtelier.map(toAtelierStatsResponse),
})
