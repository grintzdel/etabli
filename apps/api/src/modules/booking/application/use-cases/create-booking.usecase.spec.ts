import { describe, expect, it, vi } from 'vitest'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { FixedAuthContext } from '../../../../shared/testing/fixed.auth-context.ts'
import { FixedClock } from '../../../../shared/testing/fixed.clock.ts'
import { authUserFixture, machineFixture, memberOf } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import type { ICertificationRepository } from '../../../certification/domain/repositories/certification.repository.interface.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { BookingEntity } from '../../domain/entities/booking.entity.ts'
import {
  MachineNotBookableError,
  MachineUnavailableError,
  MissingCertificationError,
  SlotInThePastError,
} from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { CreateBookingUsecase } from './create-booking.usecase.ts'

const NOW = '2026-09-15T10:00:00Z'
const TOMORROW = new Date('2026-09-16T10:00:00Z')

const makeUsecase = (
  options: {
    machine?: ReturnType<typeof machineFixture> | null
    certified?: boolean
    insert?: ReturnType<typeof vi.fn>
  },
  user: AuthUser
) =>
  new CreateBookingUsecase(
    stub<IBookingRepository>({
      insert: options.insert ?? vi.fn(async (props) => BookingEntity.from(props)),
    }),
    stub<IMachineRepository>({ findById: vi.fn().mockResolvedValue(options.machine ?? null) }),
    stub<ICertificationRepository>({ isCertified: vi.fn().mockResolvedValue(options.certified ?? false) }),
    new FixedClock(NOW),
    new FixedAuthContext(user)
  )

describe('CreateBookingUsecase', () => {
  it('books a slot on an available machine the member is certified for', async () => {
    const machine = machineFixture()
    const user = authUserFixture({ memberships: [memberOf(machine.atelierId)] })

    const booking = await makeUsecase({ machine, certified: true }, user).execute({
      machineId: machine.id,
      startAt: TOMORROW,
    })

    expect(booking.startAt).toStrictEqual(TOMORROW)
    expect(booking.endAt.toISOString()).toBe('2026-09-16T11:00:00.000Z')
    expect(booking.status).toBe('CONFIRMED')
  })

  it('answers 404 on a machine nobody told the member about', async () => {
    const user = authUserFixture()

    await expect(
      makeUsecase({ machine: null }, user).execute({ machineId: 'machine-x', startAt: TOMORROW })
    ).rejects.toThrow(MachineNotBookableError)
  })

  it('answers 404 on a machine of an atelier the member has not joined', async () => {
    const machine = machineFixture()
    const user = authUserFixture({ memberships: [memberOf('another-atelier')] })

    await expect(
      makeUsecase({ machine, certified: true }, user).execute({ machineId: machine.id, startAt: TOMORROW })
    ).rejects.toThrow(MachineNotBookableError)
  })

  it('answers 404 on a retired machine, and not 409', async () => {
    const machine = machineFixture({ status: 'RETIRED' })
    const user = authUserFixture({ memberships: [memberOf(machine.atelierId)] })

    await expect(
      makeUsecase({ machine, certified: true }, user).execute({ machineId: machine.id, startAt: TOMORROW })
    ).rejects.toThrow(MachineNotBookableError)
  })

  it('answers 409 on a machine under maintenance', async () => {
    const machine = machineFixture({ status: 'MAINTENANCE' })
    const user = authUserFixture({ memberships: [memberOf(machine.atelierId)] })

    await expect(
      makeUsecase({ machine, certified: true }, user).execute({ machineId: machine.id, startAt: TOMORROW })
    ).rejects.toThrow(MachineUnavailableError)
  })

  it('refuses a slot already started', async () => {
    const machine = machineFixture()
    const user = authUserFixture({ memberships: [memberOf(machine.atelierId)] })

    await expect(
      makeUsecase({ machine, certified: true }, user).execute({
        machineId: machine.id,
        startAt: new Date('2026-09-15T09:00:00Z'),
      })
    ).rejects.toThrow(SlotInThePastError)
  })

  it('refuses a machine that asks for a certification the member has not got', async () => {
    const machine = machineFixture()
    const user = authUserFixture({ memberships: [memberOf(machine.atelierId)] })

    await expect(
      makeUsecase({ machine, certified: false }, user).execute({ machineId: machine.id, startAt: TOMORROW })
    ).rejects.toThrow(MissingCertificationError)
  })

  it('does not ask for a certification the machine does not require', async () => {
    const machine = machineFixture({ requiresCertification: false })
    const user = authUserFixture({ memberships: [memberOf(machine.atelierId)] })

    const booking = await makeUsecase({ machine, certified: false }, user).execute({
      machineId: machine.id,
      startAt: TOMORROW,
    })

    expect(booking.status).toBe('CONFIRMED')
  })

  it('checks reachability before availability, so a retired machine never reveals its state', async () => {
    const machine = machineFixture({ status: 'MAINTENANCE' })
    const user = authUserFixture({ memberships: [] })

    await expect(
      makeUsecase({ machine, certified: true }, user).execute({ machineId: machine.id, startAt: TOMORROW })
    ).rejects.toThrow(MachineNotBookableError)
  })
})
