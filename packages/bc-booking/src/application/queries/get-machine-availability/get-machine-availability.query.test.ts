import type { AtelierId, MachineId } from '@etabli/shared/schema'
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
import { BookableMachineStatus, BookingStatus, SlotReason } from '../../../domain/booking.constants'
import type { AvailabilityParams } from '../../../domain/booking.schema'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import type { BookableMachine } from '../../ports/machine-catalog'
import { getMachineAvailability } from './get-machine-availability.query'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const NOW = at('2026-03-01T00:00:00Z')

let repository: BookingRepositoryMemory

const run = (
  machineId: MachineId,
  machines: ReadonlyArray<BookableMachine>,
  params: AvailabilityParams = {},
  atelierId: AtelierId = FORGE
) =>
  Effect.runPromiseExit(
    getMachineAvailability(machineId, params).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines,
          auth: { userId: ME, memberships: memberships(atelierId, 'MEMBER') },
          now: NOW,
        })
      )
    )
  )

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('getMachineAvailability', () => {
  it('opens the week to come on a machine of an atelier the member joined', async () => {
    const machine = machineFixture({ machineName: 'Trotec', slotDurationMinutes: 120 })

    const exit = await run(machine.machineId, [machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.machineName).toBe('Trotec')
    expect(exit.value.slotDurationMinutes).toBe(120)
    expect(exit.value.slots).toHaveLength(7 * 7)
    expect(exit.value.slots.every((slot) => slot.available)).toBe(true)
  })

  it('starts the week on the day asked for', async () => {
    const machine = machineFixture()

    const exit = await run(machine.machineId, [machine], { from: at('2026-04-10T09:00:00Z') })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.from).toStrictEqual(at('2026-04-09T22:00:00Z'))
    expect(exit.value.to).toStrictEqual(at('2026-04-16T22:00:00Z'))
  })

  it('closes the slots an active booking already holds', async () => {
    const machine = machineFixture()
    const booking = bookingFixture({
      machineId: machine.machineId,
      startAt: at('2026-03-02T09:00:00Z'),
      endAt: at('2026-03-02T10:00:00Z'),
    })
    repository.bookings.set(booking.id, booking)

    const exit = await run(machine.machineId, [machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.slots.filter((slot) => slot.reason === SlotReason.BOOKED)).toHaveLength(1)
  })

  it('ignores a cancelled booking', async () => {
    const machine = machineFixture()
    const booking = bookingFixture({
      machineId: machine.machineId,
      status: BookingStatus.CANCELLED,
      startAt: at('2026-03-02T09:00:00Z'),
      endAt: at('2026-03-02T10:00:00Z'),
    })
    repository.bookings.set(booking.id, booking)

    const exit = await run(machine.machineId, [machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.slots.every((slot) => slot.available)).toBe(true)
  })

  it('answers a machine in maintenance without any bookable slot', async () => {
    const machine = machineFixture({ status: BookableMachineStatus.MAINTENANCE })

    const exit = await run(machine.machineId, [machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.machineStatus).toBe(BookableMachineStatus.MAINTENANCE)
    expect(exit.value.slots.some((slot) => slot.available)).toBe(false)
  })

  it('refuses a retired machine', async () => {
    const machine = machineFixture({ status: BookableMachineStatus.RETIRED })

    const exit = await run(machine.machineId, [machine])

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it('refuses a machine of an atelier the member has not joined', async () => {
    const machine = machineFixture({ atelierId: LYON })

    const exit = await run(machine.machineId, [machine], {}, FORGE)

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it('refuses a machine that does not exist', async () => {
    const exit = await run(globalThis.crypto.randomUUID() as MachineId, [])

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
