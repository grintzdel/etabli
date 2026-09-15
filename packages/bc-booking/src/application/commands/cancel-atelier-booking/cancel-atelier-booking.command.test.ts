import type { AtelierId } from '@etabli/shared/schema'
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
import { cancelAtelierBooking } from './cancel-atelier-booking.command'

const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const FABMANAGER = UserId.make('00000000-0000-4000-8000-000000000009')
const CAMILLE = UserId.make('00000000-0000-4000-8000-000000000001')
const BEFORE = at('2026-03-02T08:00:00Z')
const MACHINE = machineFixture()

let repository: BookingRepositoryMemory

const run = (
  booking: Booking,
  now: DateTime.Utc = BEFORE,
  atelierId: AtelierId = FORGE,
  role: 'MEMBER' | 'FABMANAGER' = 'FABMANAGER'
) =>
  Effect.runPromiseExit(
    cancelAtelierBooking(booking.id).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [MACHINE],
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, role) },
          now,
          memberNames: new Map([[CAMILLE, 'Camille Roux']]),
        })
      )
    )
  )

const store = (overrides: Partial<Booking> = {}): Promise<Booking> =>
  Effect.runPromise(repository.insert(bookingFixture({ machineId: MACHINE.machineId, userId: CAMILLE, ...overrides })))

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('cancelAtelierBooking', () => {
  it('calls off a slot of the atelier the caller runs', async () => {
    const exit = await run(await store())

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(BookingStatus.CANCELLED)
    expect(exit.value.memberName).toBe('Camille Roux')
  })

  it('calls off a slot that has already started, where the member no longer could', async () => {
    const exit = await run(await store(), at('2026-03-02T09:30:00Z'))

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it('refuses a slot that has run its course', async () => {
    expect(failureTag(await run(await store(), at('2026-03-02T10:00:00Z')))).toBe('BookingNotCancellableError')
  })

  it('refuses a slot already stamped', async () => {
    const booking = await store({ status: BookingStatus.CHECKED_IN })

    expect(failureTag(await run(booking))).toBe('BookingNotCancellableError')
  })

  it('hides a slot of another atelier behind a 404', async () => {
    expect(failureTag(await run(await store(), BEFORE, LYON))).toBe('BookingUnknownError')
  })

  it('hides every slot from a plain member of the atelier', async () => {
    expect(failureTag(await run(await store(), BEFORE, FORGE, 'MEMBER'))).toBe('BookingUnknownError')
  })
})
