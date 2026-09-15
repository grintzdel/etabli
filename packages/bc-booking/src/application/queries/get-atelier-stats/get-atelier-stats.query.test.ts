import type { AtelierId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import type * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  at,
  bookingFixture,
  FORGE,
  machineFixture,
  makeTestLayer,
  memberships,
} from '../../../__tests__/booking.test-layer'
import { BookingStatus, StatsPeriod } from '../../../domain/booking.constants'
import type { AtelierStatsParams, Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { getAtelierStats } from './get-atelier-stats.query'

const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const FABMANAGER = UserId.make('00000000-0000-4000-8000-000000000009')
const CAMILLE = UserId.make('00000000-0000-4000-8000-000000000001')
const LATE = at('2026-03-10T22:30:00Z')
const TROTEC = machineFixture({ machineName: 'Trotec' })
const PRUSA = machineFixture({ machineName: 'Prusa' })
const LYON_MACHINE = machineFixture({ atelierId: LYON, atelierName: 'Lyon Fabrique', machineName: 'Scie' })

let repository: BookingRepositoryMemory

const run = (
  params: AtelierStatsParams = {},
  atelierId: AtelierId = FORGE,
  role: 'MEMBER' | 'FABMANAGER' = 'FABMANAGER',
  now: DateTime.Utc = LATE
) =>
  Effect.runPromise(
    getAtelierStats(params).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [TROTEC, PRUSA, LYON_MACHINE],
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, role) },
          now,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}): Promise<Booking> =>
  Effect.runPromise(
    repository.insert(
      bookingFixture({
        machineId: TROTEC.machineId,
        userId: CAMILLE,
        startAt: at('2026-03-09T09:00:00Z'),
        endAt: at('2026-03-09T11:00:00Z'),
        ...overrides,
      })
    )
  )

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('getAtelierStats', () => {
  it('measures the ateliers the caller runs', async () => {
    await store()

    const stats = await run({ period: StatsPeriod.WEEK })

    expect(stats).toHaveLength(1)
    expect(stats[0]?.atelierName).toBe('La Forge')
    expect(stats[0]?.bookedHours).toBe(2)
    expect(stats[0]?.period).toBe(StatsPeriod.WEEK)
  })

  it('measures nothing for an atelier the caller only belongs to', async () => {
    await store()

    expect(await run({}, FORGE, 'MEMBER')).toStrictEqual([])
  })

  it('leaves out the ateliers the caller runs nowhere', async () => {
    await store()

    const stats = await run({ period: StatsPeriod.WEEK }, LYON)

    expect(stats.map((entry) => entry.atelierName)).toStrictEqual(['Lyon Fabrique'])
    expect(stats[0]?.bookedHours).toBe(0)
  })

  it('spans thirty days when no period is asked for', async () => {
    const stats = await run()

    expect(stats[0]?.period).toBe(StatsPeriod.MONTH)
    expect(stats[0]?.openHours).toBe(30 * 14)
  })

  it('leaves out a slot older than the span', async () => {
    await store({ startAt: at('2026-02-02T09:00:00Z'), endAt: at('2026-02-02T11:00:00Z') })

    expect((await run({ period: StatsPeriod.WEEK }))[0]?.bookedHours).toBe(0)
    expect((await run({ period: StatsPeriod.QUARTER }))[0]?.bookedHours).toBe(2)
  })

  it('tells the no-shows apart from the slots called off', async () => {
    await store({ status: BookingStatus.NO_SHOW })
    await store({
      startAt: at('2026-03-09T14:00:00Z'),
      endAt: at('2026-03-09T15:00:00Z'),
      status: BookingStatus.CANCELLED,
    })

    const stats = await run({ period: StatsPeriod.WEEK })

    expect(stats[0]?.noShows).toBe(1)
    expect(stats[0]?.cancellations).toBe(1)
    expect(stats[0]?.bookedHours).toBe(2)
  })
})
