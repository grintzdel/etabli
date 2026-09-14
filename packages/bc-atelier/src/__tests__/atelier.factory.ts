import { AtelierId, MachineId, MembershipId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'

import { AtelierStatus, MachineKind, MachineStatus } from '../domain/atelier.constants'
import type { Atelier, Machine, Membership } from '../domain/atelier.schema'
import { Slug } from '../domain/atelier.schema'

const uuid = () => globalThis.crypto.randomUUID()
const epoch = DateTime.unsafeFromDate(new Date('2026-01-01T00:00:00Z'))

let counter = 0

export const atelierFixture = (overrides: Partial<Atelier> = {}): Atelier => {
  counter += 1
  return {
    id: AtelierId.make(uuid()),
    slug: Slug.make(`atelier-${counter}`),
    name: `Atelier ${counter}`,
    description: 'Un atelier partagé',
    street: '12 rue des Forges',
    postalCode: '93100',
    city: 'Montreuil',
    country: 'FR',
    latitude: 48.8638,
    longitude: 2.4485,
    status: AtelierStatus.PUBLISHED,
    createdAt: epoch,
    updatedAt: epoch,
    ...overrides,
  }
}

export const machineFixture = (atelierId: Atelier['id'], overrides: Partial<Machine> = {}): Machine => {
  counter += 1
  return {
    id: MachineId.make(uuid()),
    atelierId,
    name: `Machine ${counter}`,
    description: 'Une machine du parc',
    kind: MachineKind.LASER_CUTTER,
    requiresCertification: true,
    slotDurationMinutes: 60,
    status: MachineStatus.AVAILABLE,
    nfcTagId: null,
    createdAt: epoch,
    updatedAt: epoch,
    ...overrides,
  }
}

export const membershipFixture = (atelierId: Atelier['id'], overrides: Partial<Membership> = {}): Membership => ({
  id: MembershipId.make(uuid()),
  userId: UserId.make(uuid()),
  atelierId,
  role: 'MEMBER',
  status: 'ACTIVE',
  joinedAt: epoch,
  ...overrides,
})

export const defaultParams = { limit: 20, offset: 0 } as const
