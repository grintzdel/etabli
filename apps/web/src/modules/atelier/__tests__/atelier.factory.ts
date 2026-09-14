import type { AtelierDetail, AtelierSummary, PublicMachine } from '@/modules/atelier/core/model/atelier'

let counter = 0

export const machineFixture = (overrides: Partial<PublicMachine> = {}): PublicMachine => {
  counter += 1
  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    name: `Machine ${counter}`,
    description: 'Une machine du parc',
    kind: 'LASER_CUTTER',
    requiresCertification: true,
    slotDurationMinutes: 60,
    status: 'AVAILABLE',
    ...overrides,
  }
}

export const summaryFixture = (overrides: Partial<AtelierSummary> = {}): AtelierSummary => {
  counter += 1
  return {
    id: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    slug: `atelier-${counter}`,
    name: `Atelier ${counter}`,
    description: 'Un atelier partagé',
    city: 'Montreuil',
    country: 'FR',
    latitude: 48.8638,
    longitude: 2.4485,
    machineCount: 2,
    machineKinds: ['LASER_CUTTER', 'PRINTER_3D'],
    distanceKm: null,
    ...overrides,
  }
}

export const detailFixture = (overrides: Partial<AtelierDetail> = {}): AtelierDetail => {
  counter += 1
  return {
    id: `20000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    slug: `atelier-${counter}`,
    name: `Atelier ${counter}`,
    description: 'Un atelier partagé',
    street: '12 rue des Forges',
    postalCode: '93100',
    city: 'Montreuil',
    country: 'FR',
    latitude: 48.8638,
    longitude: 2.4485,
    machines: [machineFixture()],
    ...overrides,
  }
}
