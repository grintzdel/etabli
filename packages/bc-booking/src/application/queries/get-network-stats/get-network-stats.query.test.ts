import type { AtelierId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import * as Cause from 'effect/Cause'
import type * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Option from 'effect/Option'
import { beforeEach, describe, expect, it } from 'vitest'

import { at, bookingFixture, machineFixture, makeTestLayer } from '../../../__tests__/booking.test-layer'
import { BookingStatus, StatsPeriod } from '../../../domain/booking.constants'
import type { AtelierStatsParams, Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { getNetworkStats } from './get-network-stats.query'

const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const ADMIN = UserId.make('00000000-0000-4000-8000-000000000009')
const CAMILLE = UserId.make('00000000-0000-4000-8000-000000000001')
const LATE = at('2026-03-10T22:30:00Z')
const TROTEC = machineFixture({ machineName: 'Trotec' })
const PRUSA = machineFixture({ machineName: 'Prusa' })
const SCIE = machineFixture({ atelierId: LYON, atelierName: 'Lyon Fabrique', machineName: 'Scie' })

let repository: BookingRepositoryMemory

const failureTag = (exit: Exit.Exit<unknown, unknown>): string => {
  if (Exit.isSuccess(exit)) return 'success'
  const failure = Cause.failureOption(exit.cause)
  return Option.isSome(failure) ? ((failure.value as { readonly _tag?: string })._tag ?? 'untagged') : 'defect'
}

const run = (
  params: AtelierStatsParams = { period: StatsPeriod.WEEK },
  platformRole: 'PLATFORM_ADMIN' | 'MEMBER' = 'PLATFORM_ADMIN',
  now: DateTime.Utc = LATE
) =>
  Effect.runPromiseExit(
    getNetworkStats(params).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [TROTEC, PRUSA, SCIE],
          auth: { userId: ADMIN, platformRole, memberships: [] },
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

describe('getNetworkStats', () => {
  it('refuses a caller who is not a platform admin', async () => {
    expect(failureTag(await run({ period: StatsPeriod.WEEK }, 'MEMBER'))).toBe('ForbiddenError')
  })

  it('counts the whole park of the network', async () => {
    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.ateliers).toBe(2)
    expect(exit.value.machines).toBe(3)
    expect(exit.value.openHours).toBe(7 * 14)
  })

  it('adds up the hours of every atelier', async () => {
    await store()
    await store({
      atelierId: LYON,
      machineId: SCIE.machineId,
      startAt: at('2026-03-09T14:00:00Z'),
      endAt: at('2026-03-09T15:00:00Z'),
    })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.bookedHours).toBe(3)
    expect(exit.value.occupancyRate).toBe(Number((3 / (7 * 14 * 3)).toFixed(3)))
  })

  it('puts the busiest atelier first', async () => {
    await store({ atelierId: LYON, machineId: SCIE.machineId })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.byAtelier.map((atelier) => atelier.atelierName)).toStrictEqual(['Lyon Fabrique', 'La Forge'])
  })

  it('tells the no-shows apart from the slots called off', async () => {
    await store({ status: BookingStatus.NO_SHOW })
    await store({
      startAt: at('2026-03-09T14:00:00Z'),
      endAt: at('2026-03-09T15:00:00Z'),
      status: BookingStatus.CANCELLED,
    })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.noShows).toBe(1)
    expect(exit.value.cancellations).toBe(1)
  })

  it('spans thirty days when no period is asked for', async () => {
    const exit = await run({})

    if (Exit.isFailure(exit)) return
    expect(exit.value.period).toBe(StatsPeriod.MONTH)
    expect(exit.value.openHours).toBe(30 * 14)
  })
})
