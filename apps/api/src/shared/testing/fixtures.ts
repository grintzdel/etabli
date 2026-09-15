import type { MachineWithAtelier } from '../../modules/machine/domain/entities/machine.entity.ts'
import type { AuthMembership, AuthUser } from '../domain/auth-user.ts'
import { MembershipRole, PlatformRole } from '../domain/roles.constant.ts'

let counter = 0

export const nextId = (prefix: string): string => {
  counter += 1
  return `${prefix}-${counter}`
}

export const memberOf = (atelierId: string): AuthMembership => ({ atelierId, role: MembershipRole.MEMBER })

export const fabmanagerOf = (atelierId: string): AuthMembership => ({
  atelierId,
  role: MembershipRole.FABMANAGER,
})

export const authUserFixture = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: nextId('user'),
  platformRole: PlatformRole.MEMBER,
  memberships: [],
  ...overrides,
})

export const machineFixture = (overrides: Partial<MachineWithAtelier> = {}): MachineWithAtelier => ({
  id: nextId('machine'),
  atelierId: 'atelier-1',
  name: 'Trotec Speedy 400',
  description: '',
  kind: 'LASER_CUTTER',
  requiresCertification: true,
  slotDurationMinutes: 60,
  status: 'AVAILABLE',
  nfcTagId: 'nfc-forge-laser-01',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  atelierName: 'La Forge',
  atelierSlug: 'la-forge-montreuil',
  ...overrides,
})
