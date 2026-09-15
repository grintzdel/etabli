import type { AtelierId, MachineId } from '@etabli/shared/schema'
import { UserId } from '@etabli/shared/schema'
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
import { BookableMachineStatus, BookingStatus } from '../../../domain/booking.constants'
import type { BookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import { makeBookingRepositoryMemory } from '../../../infrastructure/booking.repository.memory'
import type { BookableMachine } from '../../ports/machine-catalog'
import { createBooking } from './create-booking.command'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId
const NOW = at('2026-03-01T00:00:00Z')
const START = at('2026-03-02T09:00:00Z')

let repository: BookingRepositoryMemory

interface RunOptions {
  readonly machines: ReadonlyArray<BookableMachine>
  readonly certifiedOn?: ReadonlyArray<MachineId>
  readonly atelierId?: AtelierId
}

const run = (machineId: MachineId, startAt: typeof START, { machines, certifiedOn, atelierId = FORGE }: RunOptions) =>
  Effect.runPromiseExit(
    createBooking({ machineId, startAt }).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines,
          certifiedOn,
          auth: { userId: ME, memberships: memberships(atelierId, 'MEMBER') },
          now: NOW,
        })
      )
    )
  )

beforeEach(() => {
  repository = makeBookingRepositoryMemory()
})

describe('createBooking', () => {
  it('confirms a booking whose end comes from the slot duration of the machine', async () => {
    const machine = machineFixture({ requiresCertification: false, slotDurationMinutes: 120 })

    const exit = await run(machine.machineId, START, { machines: [machine] })

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(BookingStatus.CONFIRMED)
    expect(exit.value.machineName).toBe(machine.machineName)
    expect(exit.value.atelierId).toBe(FORGE)
    expect(exit.value.canCancel).toBe(true)
    expect(exit.value.startAt).toStrictEqual(START)
    expect(exit.value.endAt).toStrictEqual(at('2026-03-02T11:00:00Z'))
  })

  it('refuses a machine that does not exist', async () => {
    const exit = await run(machineFixture().machineId, START, { machines: [] })

    expect(failureTag(exit)).toBe('MachineNotBookableError')
  })

  it('refuses a machine of an atelier the member never joined', async () => {
    const machine = machineFixture({ requiresCertification: false })

    const exit = await run(machine.machineId, START, { machines: [machine], atelierId: LYON })

    expect(failureTag(exit)).toBe('MachineNotBookableError')
  })

  it('refuses a machine under maintenance', async () => {
    const machine = machineFixture({ requiresCertification: false, status: BookableMachineStatus.MAINTENANCE })

    const exit = await run(machine.machineId, START, { machines: [machine] })

    expect(failureTag(exit)).toBe('MachineUnavailableError')
  })

  it('refuses a slot that already went by', async () => {
    const machine = machineFixture({ requiresCertification: false })

    const exit = await run(machine.machineId, at('2026-02-20T09:00:00Z'), { machines: [machine] })

    expect(failureTag(exit)).toBe('SlotInThePastError')
  })

  it('refuses a machine whose certification the member does not hold', async () => {
    const machine = machineFixture({ requiresCertification: true })

    const exit = await run(machine.machineId, START, { machines: [machine] })

    expect(failureTag(exit)).toBe('MissingCertificationError')
  })

  it('accepts the same machine once the certification is granted', async () => {
    const machine = machineFixture({ requiresCertification: true })

    const exit = await run(machine.machineId, START, { machines: [machine], certifiedOn: [machine.machineId] })

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it('asks for no certification on a machine that requires none', async () => {
    const machine = machineFixture({ requiresCertification: false })

    const exit = await run(machine.machineId, START, { machines: [machine] })

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it('refuses a slot another booking already holds', async () => {
    const machine = machineFixture({ requiresCertification: false })
    await Effect.runPromise(
      repository.insert(
        bookingFixture({ machineId: machine.machineId, startAt: START, endAt: at('2026-03-02T10:00:00Z') })
      )
    )

    const exit = await run(machine.machineId, at('2026-03-02T09:30:00Z'), { machines: [machine] })

    expect(failureTag(exit)).toBe('BookingOverlapError')
  })
})
