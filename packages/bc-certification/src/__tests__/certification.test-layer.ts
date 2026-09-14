import type { AuthMembership, AuthContextService } from '@etabli/shared/auth-context'
import { AuthContext } from '@etabli/shared/auth-context'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import type { AtelierId, MachineId, UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { CertifiableMachine } from '../application/ports/machine-directory'
import { MachineDirectory } from '../application/ports/machine-directory'
import { MemberDirectory } from '../application/ports/member-directory'
import { CertificationRepository } from '../infrastructure/certification.repository'
import type { CertificationRepositoryMemory } from '../infrastructure/certification.repository.memory'

export const machineFixture = (overrides: Partial<CertifiableMachine> = {}): CertifiableMachine => ({
  machineId: globalThis.crypto.randomUUID() as MachineId,
  machineName: 'Trotec Speedy',
  atelierId: '10000000-0000-4000-8000-000000000001' as AtelierId,
  atelierName: 'La Forge',
  atelierSlug: 'la-forge',
  requiresCertification: true,
  retired: false,
  ...overrides,
})

export const makeMachineDirectory = (machines: ReadonlyArray<CertifiableMachine>) =>
  MachineDirectory.of({
    find: (machineId) => Effect.sync(() => machines.find((machine) => machine.machineId === machineId) ?? null),
    findMany: (machineIds) => Effect.sync(() => machines.filter((machine) => machineIds.includes(machine.machineId))),
    listForAteliers: (atelierIds) =>
      Effect.sync(() => machines.filter((machine) => atelierIds.includes(machine.atelierId))),
  })

export const makeMemberDirectory = (names: ReadonlyMap<UserId, string>) =>
  MemberDirectory.of({ namesOf: () => Effect.succeed(names) })

export interface TestLayerOptions {
  readonly repository: CertificationRepositoryMemory
  readonly machines: ReadonlyArray<CertifiableMachine>
  readonly auth: Partial<AuthContextService> & { readonly userId: UserId }
  readonly names?: ReadonlyMap<UserId, string>
}

export const memberships = (atelierId: AtelierId, role: AuthMembership['role']): ReadonlyArray<AuthMembership> => [
  { atelierId, role },
]

export const makeTestLayer = ({ repository, machines, auth, names = new Map() }: TestLayerOptions) =>
  Layer.mergeAll(
    Layer.succeed(CertificationRepository, repository),
    Layer.succeed(MachineDirectory, makeMachineDirectory(machines)),
    Layer.succeed(MemberDirectory, makeMemberDirectory(names)),
    Layer.succeed(AuthContext, { platformRole: 'MEMBER', memberships: [], ...auth }),
    IdGeneratorCryptoLive,
    ClockSystemLive
  )
