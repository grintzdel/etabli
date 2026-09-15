import { UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  at,
  bookingFixture,
  FORGE,
  machineFixture,
  makeTestLayer,
  memberships,
} from '../../../__tests__/booking.test-layer'
import { BookingStatus } from '../../../domain/booking.constants'
import type { Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { listMyBookings } from './list-my-bookings.query'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const SOMEONE_ELSE = UserId.make('00000000-0000-4000-8000-000000000002')
const NOW = at('2026-03-01T00:00:00Z')
const TROTEC = machineFixture({ machineName: 'Trotec', atelierName: 'La Forge' })
const PRUSA = machineFixture({ machineName: 'Prusa' })

let repository: BookingRepositoryMemory

const run = () =>
  Effect.runPromiseExit(
    listMyBookings().pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [TROTEC, PRUSA],
          auth: { userId: ME, memberships: memberships(FORGE, 'MEMBER') },
          now: NOW,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}) =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: TROTEC.machineId, userId: ME, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('listMyBookings', () => {
  it('names the machine and the atelier of each booking', async () => {
    await store()

    const exit = await run()

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.machineName).toBe('Trotec')
    expect(exit.value[0]?.atelierName).toBe('La Forge')
  })

  it('leaves out what other members booked', async () => {
    await store()
    await store({ userId: SOMEONE_ELSE, machineId: PRUSA.machineId })

    const exit = await run()

    expect(Exit.isFailure(exit)).toBe(false)
    if (Exit.isFailure(exit)) return
    expect(exit.value.map((entry) => entry.machineName)).toStrictEqual(['Trotec'])
  })

  it('puts the most recent booking first', async () => {
    await store({ startAt: at('2026-03-02T09:00:00Z'), endAt: at('2026-03-02T10:00:00Z') })
    await store({ startAt: at('2026-03-05T09:00:00Z'), endAt: at('2026-03-05T10:00:00Z') })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.map((entry) => entry.startAt)).toStrictEqual([
      at('2026-03-05T09:00:00Z'),
      at('2026-03-02T09:00:00Z'),
    ])
  })

  it('tells which bookings the member can still cancel', async () => {
    await store({ startAt: at('2026-03-05T09:00:00Z'), endAt: at('2026-03-05T10:00:00Z') })
    await store({
      startAt: at('2026-03-02T09:00:00Z'),
      endAt: at('2026-03-02T10:00:00Z'),
      status: BookingStatus.CANCELLED,
    })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value.map((entry) => entry.canCancel)).toStrictEqual([true, false])
  })

  it('reads a stamped slot that has run its course as completed', async () => {
    await store({
      startAt: at('2026-02-20T09:00:00Z'),
      endAt: at('2026-02-20T10:00:00Z'),
      status: BookingStatus.CHECKED_IN,
    })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.status).toBe(BookingStatus.COMPLETED)
  })

  it('leaves a stamped slot still running as checked in', async () => {
    await store({
      startAt: at('2026-02-28T23:30:00Z'),
      endAt: at('2026-03-01T00:30:00Z'),
      status: BookingStatus.CHECKED_IN,
    })

    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.status).toBe(BookingStatus.CHECKED_IN)
  })

  it('answers an empty list when the member booked nothing', async () => {
    const exit = await run()

    if (Exit.isFailure(exit)) return
    expect(exit.value).toStrictEqual([])
  })
})
