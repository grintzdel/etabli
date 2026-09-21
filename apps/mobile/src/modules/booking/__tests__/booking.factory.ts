import type { BookingDetail } from '../core/model/booking'

let counter = 0

export const bookingDetailFixture = (overrides: Partial<BookingDetail> = {}): BookingDetail => {
  counter += 1

  return {
    id: `booking-${counter}`,
    machineId: `machine-${counter}`,
    machineName: 'Fraiseuse numérique',
    atelierId: `atelier-${counter}`,
    atelierName: 'Atelier de la Villette',
    atelierSlug: 'atelier-de-la-villette',
    startAt: '2026-09-18T12:00:00.000Z',
    endAt: '2026-09-18T14:00:00.000Z',
    status: 'CONFIRMED',
    checkedInAt: null,
    cancelledAt: null,
    canCancel: true,
    canCheckIn: false,
    ...overrides,
  }
}
