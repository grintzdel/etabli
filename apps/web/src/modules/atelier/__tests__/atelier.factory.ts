import type {
  AdminAtelier,
  AtelierDetail,
  AtelierSummary,
  MachineDetail,
  ManagedMachine,
  PublicMachine,
} from '@/modules/atelier/core/model/atelier'

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

export const machineDetailFixture = (overrides: Partial<MachineDetail> = {}): MachineDetail => {
  counter += 1
  return {
    id: `50000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierName: `Atelier ${counter}`,
    atelierSlug: `atelier-${counter}`,
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

export const adminAtelierFixture = (overrides: Partial<AdminAtelier> = {}): AdminAtelier => {
  counter += 1
  return {
    id: `30000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    slug: `atelier-${counter}`,
    name: `Atelier ${counter}`,
    city: 'Montreuil',
    status: 'DRAFT',
    machineCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export const managedMachineFixture = (overrides: Partial<ManagedMachine> = {}): ManagedMachine => {
  counter += 1
  return {
    id: `40000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    name: `Machine ${counter}`,
    description: 'Une machine du parc',
    kind: 'LASER_CUTTER',
    requiresCertification: true,
    slotDurationMinutes: 60,
    status: 'AVAILABLE',
    nfcTagId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
