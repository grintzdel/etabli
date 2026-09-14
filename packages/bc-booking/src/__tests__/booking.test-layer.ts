import type { AuthContextService, AuthMembership } from '@etabli/shared/auth-context'
import { AuthContext } from '@etabli/shared/auth-context'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import type { AtelierId, MachineId, UserId } from '@etabli/shared/schema'
import { BookingId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { BookableMachine } from '../application/ports/machine-catalog'
import { MachineCatalog } from '../application/ports/machine-catalog'
import { BookableMachineStatus, BookingStatus } from '../domain/booking.constants'
import type { Booking } from '../domain/booking.schema'
import { BookingRepository } from '../infrastructure/booking.repository'
import type { BookingRepositoryMemory } from '../infrastructure/booking.repository.memory'

export const FORGE = '10000000-0000-4000-8000-000000000001' as AtelierId

export const at = (iso: string): DateTime.Utc => DateTime.unsafeFromDate(new Date(iso))

export const machineFixture = (overrides: Partial<BookableMachine> = {}): BookableMachine => ({
  machineId: globalThis.crypto.randomUUID() as MachineId,
  machineName: 'Trotec Speedy',
  atelierId: FORGE,
  atelierName: 'La Forge',
  atelierSlug: 'la-forge',
  status: BookableMachineStatus.AVAILABLE,
  requiresCertification: true,
  slotDurationMinutes: 60,
  nfcTagId: null,
  ...overrides,
})

export const bookingFixture = (overrides: Partial<Booking> = {}): Booking => ({
  id: BookingId.make(globalThis.crypto.randomUUID()),
  machineId: globalThis.crypto.randomUUID() as MachineId,
  atelierId: FORGE,
  userId: '00000000-0000-4000-8000-000000000001' as UserId,
  startAt: at('2026-03-02T09:00:00Z'),
  endAt: at('2026-03-02T10:00:00Z'),
  status: BookingStatus.CONFIRMED,
  checkedInAt: null,
  checkedInVia: null,
  cancelledAt: null,
  cancelledBy: null,
  createdAt: at('2026-03-01T00:00:00Z'),
  updatedAt: at('2026-03-01T00:00:00Z'),
  ...overrides,
})

export const memberships = (atelierId: AtelierId, role: AuthMembership['role']): ReadonlyArray<AuthMembership> => [
  { atelierId, role },
]

export interface TestLayerOptions {
  readonly repository: BookingRepositoryMemory
  readonly machines: ReadonlyArray<BookableMachine>
  readonly auth: Partial<AuthContextService> & { readonly userId: UserId }
  readonly now: DateTime.Utc
}

export const makeTestLayer = ({ repository, machines, auth, now }: TestLayerOptions) =>
  Layer.mergeAll(
    Layer.succeed(BookingRepository, repository),
    Layer.succeed(
      MachineCatalog,
      MachineCatalog.of({
        find: (machineId) => Effect.sync(() => machines.find((machine) => machine.machineId === machineId) ?? null),
      })
    ),
    Layer.succeed(AuthContext, { platformRole: 'MEMBER', memberships: [], ...auth }),
    Layer.succeed(Clock, { now: Effect.succeed(now) }),
    IdGeneratorCryptoLive
  )
