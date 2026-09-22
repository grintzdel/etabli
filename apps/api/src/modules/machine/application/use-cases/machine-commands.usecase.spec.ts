import { describe, expect, it, vi } from 'vitest'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { FixedAuthContext } from '../../../../shared/testing/fixed.auth-context.ts'
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

const creating = (user: AuthUser) =>
  new CreateMachineUsecase(
    stub<IMachineRepository>({ insert: vi.fn(async (input) => machineFixture({ ...input })) }),
    CLOCK,
    new FixedAuthContext(user)
  )

describe('CreateMachineUsecase', () => {
  it('adds a machine to an atelier the fabmanager runs', async () => {
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    expect((await creating(fabmanager).execute(body)).name).toBe('Trotec Speedy 400')
  })

  it('refuses a plain member with a 403', async () => {
    const member = authUserFixture({ memberships: [memberOf(MACHINE.atelierId)] })
    const usecase = new CreateMachineUsecase(stub<IMachineRepository>({}), CLOCK, new FixedAuthContext(member))

    await expect(usecase.execute(body)).rejects.toThrow(NotYourAtelierError)
  })

  it('hands every new machine its own check-in token', async () => {
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    const first = await creating(fabmanager).execute(body)
    const second = await creating(fabmanager).execute(body)

    expect(first.checkInToken).not.toBe('')
    expect(first.checkInToken).not.toBe(second.checkInToken)
  })
})

describe('UpdateMachineUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  const usecase = (user: AuthUser, found: typeof MACHINE | null = MACHINE) =>
    new UpdateMachineUsecase(
      stub<IMachineRepository>({
        findById: vi.fn().mockResolvedValue(found),
        update: vi.fn(async (_id, patch) => machineFixture({ ...MACHINE, ...patch })),
      }),
      CLOCK,
      new FixedAuthContext(user)
    )

  it('hides a machine of another atelier behind a 404', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })

    await expect(usecase(stranger).execute(MACHINE.id, { name: 'Renommée' })).rejects.toThrow(MachineUnknownError)
  })

  it('renames a machine of an atelier the fabmanager runs', async () => {
    const updated = await usecase(fabmanager).execute(MACHINE.id, { name: 'Renommée' })

    expect(updated.name).toBe('Renommée')
  })

  it('leaves the check-in token alone', async () => {
    const updated = await usecase(fabmanager).execute(MACHINE.id, { name: 'Renommée' })

    expect(updated.checkInToken).toBe('qr-forge-laser-01')
  })
})

describe('RegenerateCheckInTokenUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  const usecase = (user: AuthUser, found: typeof MACHINE | null = MACHINE) =>
    new RegenerateCheckInTokenUsecase(
      stub<IMachineRepository>({
        findById: vi.fn().mockResolvedValue(found),
        update: vi.fn(async (_id, patch) => machineFixture({ ...MACHINE, ...patch })),
      }),
      CLOCK,
      new FixedAuthContext(user)
    )

  it('retires the token the lost sticker carried', async () => {
    const updated = await usecase(fabmanager).execute(MACHINE.id)

    expect(updated.checkInToken).not.toBe('qr-forge-laser-01')
  })

  it('hides a machine of another atelier behind a 404', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })

    await expect(usecase(stranger).execute(MACHINE.id)).rejects.toThrow(MachineUnknownError)
  })
})
