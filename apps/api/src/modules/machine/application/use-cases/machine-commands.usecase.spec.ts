import { describe, expect, it, vi } from 'vitest'

import { FixedClock } from '../../../../shared/testing/fixed.clock.ts'
import { authUserFixture, fabmanagerOf, machineFixture, memberOf } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import { MachineUnknownError, NotYourAtelierError } from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { CreateMachineUsecase } from './create-machine.usecase.ts'
import { RegenerateCheckInTokenUsecase } from './regenerate-check-in-token.usecase.ts'
import { UpdateMachineUsecase } from './update-machine.usecase.ts'

const CLOCK = new FixedClock('2026-09-15T10:00:00Z')
const MACHINE = machineFixture({ checkInToken: 'qr-forge-laser-01' })

const body = {
  atelierId: MACHINE.atelierId,
  name: 'Trotec Speedy 400',
  description: '',
  kind: 'LASER_CUTTER' as const,
  requiresCertification: true,
  slotDurationMinutes: 60,
}

const creating = () =>
  new CreateMachineUsecase(
    stub<IMachineRepository>({ insert: vi.fn(async (input) => machineFixture({ ...input })) }),
    CLOCK
  )

describe('CreateMachineUsecase', () => {
  it('adds a machine to an atelier the fabmanager runs', async () => {
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    expect((await creating().execute(fabmanager, body)).name).toBe('Trotec Speedy 400')
  })

  it('refuses a plain member with a 403', async () => {
    const usecase = new CreateMachineUsecase(stub<IMachineRepository>({}), CLOCK)
    const member = authUserFixture({ memberships: [memberOf(MACHINE.atelierId)] })

    await expect(usecase.execute(member, body)).rejects.toThrow(NotYourAtelierError)
  })

  it('hands every new machine its own check-in token', async () => {
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    const first = await creating().execute(fabmanager, body)
    const second = await creating().execute(fabmanager, body)

    expect(first.checkInToken).not.toBe('')
    expect(first.checkInToken).not.toBe(second.checkInToken)
  })
})

describe('UpdateMachineUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  const usecase = (found: typeof MACHINE | null = MACHINE) =>
    new UpdateMachineUsecase(
      stub<IMachineRepository>({
        findById: vi.fn().mockResolvedValue(found),
        update: vi.fn(async (_id, patch) => machineFixture({ ...MACHINE, ...patch })),
      }),
      CLOCK
    )

  it('hides a machine of another atelier behind a 404', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })

    await expect(usecase().execute(stranger, MACHINE.id, { name: 'Renommée' })).rejects.toThrow(MachineUnknownError)
  })

  it('renames a machine of an atelier the fabmanager runs', async () => {
    const updated = await usecase().execute(fabmanager, MACHINE.id, { name: 'Renommée' })

    expect(updated.name).toBe('Renommée')
  })

  it('leaves the check-in token alone', async () => {
    const updated = await usecase().execute(fabmanager, MACHINE.id, { name: 'Renommée' })

    expect(updated.checkInToken).toBe('qr-forge-laser-01')
  })
})

describe('RegenerateCheckInTokenUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  const usecase = (found: typeof MACHINE | null = MACHINE) =>
    new RegenerateCheckInTokenUsecase(
      stub<IMachineRepository>({
        findById: vi.fn().mockResolvedValue(found),
        update: vi.fn(async (_id, patch) => machineFixture({ ...MACHINE, ...patch })),
      }),
      CLOCK
    )

  it('retires the token the lost sticker carried', async () => {
    const updated = await usecase().execute(fabmanager, MACHINE.id)

    expect(updated.checkInToken).not.toBe('qr-forge-laser-01')
  })

  it('hides a machine of another atelier behind a 404', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })

    await expect(usecase().execute(stranger, MACHINE.id)).rejects.toThrow(MachineUnknownError)
  })
})
