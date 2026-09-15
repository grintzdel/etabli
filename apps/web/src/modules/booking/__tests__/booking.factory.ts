import type { BookingDetail } from '@/modules/booking/core/model/booking'
import type { AtelierBooking } from '@/modules/booking/core/model/manage-booking'
import type { AtelierStats, MachineUsage, NetworkStats } from '@/modules/booking/core/model/manage-stats'

let counter = 0

export const bookingDetailFixture = (overrides: Partial<BookingDetail> = {}): BookingDetail => {
  counter += 1
  return {
    id: `80000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineId: `50000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineName: `Machine ${counter}`,
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierName: 'La Forge',
    atelierSlug: 'la-forge',
    startAt: '2026-06-01T08:00:00.000Z',
    endAt: '2026-06-01T10:00:00.000Z',
    status: 'CONFIRMED',
    checkedInAt: null,
    cancelledAt: null,
    canCancel: true,
    canCheckIn: false,
    ...overrides,
  }
}

export const atelierBookingFixture = (overrides: Partial<AtelierBooking> = {}): AtelierBooking => {
  counter += 1
  return {
    id: `80000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineId: `50000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineName: `Machine ${counter}`,
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierName: 'La Forge',
    userId: `90000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    memberName: 'Camille Roux',
    startAt: '2026-06-01T08:00:00.000Z',
    endAt: '2026-06-01T10:00:00.000Z',
    status: 'CONFIRMED',
    checkedInAt: null,
    checkedInVia: null,
    canCheckIn: true,
    canMarkNoShow: false,
    canCancel: false,
    ...overrides,
  }
}

export const machineUsageFixture = (overrides: Partial<MachineUsage> = {}): MachineUsage => {
  counter += 1
  return {
    machineId: `50000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineName: `Machine ${counter}`,
    bookings: 0,
    bookedHours: 0,
    occupancyRate: 0,
    noShows: 0,
    ...overrides,
  }
}

export const atelierStatsFixture = (overrides: Partial<AtelierStats> = {}): AtelierStats => {
  counter += 1
  return {
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierName: 'La Forge',
    period: '30d',
    from: '2026-05-03T22:00:00.000Z',
    to: '2026-06-02T22:00:00.000Z',
    openHours: 420,
    bookings: 0,
    bookedHours: 0,
    consumedHours: 0,
    noShows: 0,
    cancellations: 0,
    occupancyRate: 0,
    machines: [],
    ...overrides,
  }
}

export const networkStatsFixture = (overrides: Partial<NetworkStats> = {}): NetworkStats => ({
  period: '30d',
  from: '2026-05-03T22:00:00.000Z',
  to: '2026-06-02T22:00:00.000Z',
  ateliers: 0,
  machines: 0,
  openHours: 420,
  bookings: 0,
  bookedHours: 0,
  consumedHours: 0,
  noShows: 0,
  cancellations: 0,
  occupancyRate: 0,
  byAtelier: [],
  ...overrides,
})
