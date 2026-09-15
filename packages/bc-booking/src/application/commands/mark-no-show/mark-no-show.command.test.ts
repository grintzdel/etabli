import type { AtelierId, BookingId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
import type * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  at,
  bookingFixture,
  failureTag,
  FORGE,
  machineFixture,
  makeTestLayer,
  memberships,
} from '../../../__tests__/booking.test-layer'
import { BookingStatus } from '../../../domain/booking.constants'
import type { Booking } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { markNoShow } from './mark-no-show.command'

const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const FABMANAGER = UserId.make('00000000-0000-4000-8000-000000000009')
const MEMBER = UserId.make('00000000-0000-4000-8000-000000000001')
const AFTER_THE_WINDOW = at('2026-03-02T10:00:00Z')
const MACHINE = machineFixture()
const NAMES = new Map([[MEMBER, 'Camille Roux']])

let repository: BookingRepositoryMemory

const run = (
  bookingId: BookingId,
  atelierId: AtelierId = FORGE,
  role: 'MEMBER' | 'FABMANAGER' = 'FABMANAGER',
  now: DateTime.Utc = AFTER_THE_WINDOW
) =>
  Effect.runPromiseExit(
    markNoShow(bookingId).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [MACHINE],
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, role) },
          now,
          memberNames: NAMES,
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}): Promise<Booking> =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: MACHINE.machineId, userId: MEMBER, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('markNoShow', () => {
  it('marks a slot nobody came to', async () => {
    const booking = await store()

    const exit = await run(booking.id)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(BookingStatus.NO_SHOW)
    expect(exit.value.memberName).toBe('Camille Roux')
    expect(exit.value.canMarkNoShow).toBe(false)
  })

  it('waits for the pointing window to close', async () => {
    const booking = await store()

    expect(failureTag(await run(booking.id, FORGE, 'FABMANAGER', at('2026-03-02T09:30:00Z')))).toBe(
      'BookingNotMarkableAsNoShowError'
    )
  })

  it('refuses a slot the member did point', async () => {
    const booking = await store({ status: BookingStatus.CHECKED_IN })

    expect(failureTag(await run(booking.id))).toBe('BookingNotMarkableAsNoShowError')
  })

  it('refuses a slot already marked', async () => {
    const booking = await store()
    await run(booking.id)

    expect(failureTag(await run(booking.id))).toBe('BookingNotMarkableAsNoShowError')
  })

  it('hides a slot held by an atelier the caller does not run', async () => {
    const booking = await store()

    expect(failureTag(await run(booking.id, LYON))).toBe('BookingUnknownError')
  })

  it('hides a slot from a plain member of the same atelier', async () => {
    const booking = await store()

    expect(failureTag(await run(booking.id, FORGE, 'MEMBER'))).toBe('BookingUnknownError')
  })
})
