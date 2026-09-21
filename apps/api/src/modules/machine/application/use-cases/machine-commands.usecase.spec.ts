import { describe, expect, it, vi } from 'vitest'

import { FixedClock } from '../../../../shared/testing/fixed.clock.ts'
import { authUserFixture, fabmanagerOf, machineFixture, memberOf } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import {
  MachineNfcTagTakenError,
  MachineUnknownError,
  NotYourAtelierError,
} from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { CreateMachineUsecase } from './create-machine.usecase.ts'
import { UpdateMachineUsecase } from './update-machine.usecase.ts'

const CLOCK = new FixedClock('2026-09-15T10:00:00Z')
const MACHINE = machineFixture({ nfcTagId: 'nfc-forge-laser-01' })

const body = {
  atelierId: MACHINE.atelierId,
  name: 'Trotec Speedy 400',
  description: '',
  kind: 'LASER_CUTTER' as const,
  requiresCertification: true,
  slotDurationMinutes: 60,
  nfcTagId: null,
}

describe('CreateMachineUsecase', () => {
  it('adds a machine to an atelier the fabmanager runs', async () => {
    const usecase = new CreateMachineUsecase(
      stub<IMachineRepository>({ insert: vi.fn(async (input) => machineFixture({ ...input })) }),
      CLOCK
    )
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    expect((await usecase.execute(fabmanager, body)).name).toBe('Trotec Speedy 400')
  })

  it('refuses a plain member with a 403', async () => {
    const usecase = new CreateMachineUsecase(stub<IMachineRepository>({}), CLOCK)
    const member = authUserFixture({ memberships: [memberOf(MACHINE.atelierId)] })

    await expect(usecase.execute(member, body)).rejects.toThrow(NotYourAtelierError)
  })

  it('refuses a tag another machine already carries', async () => {
    const usecase = new CreateMachineUsecase(
      stub<IMachineRepository>({ findByNfcTag: vi.fn().mockResolvedValue(MACHINE) }),
      CLOCK
    )
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    await expect(usecase.execute(fabmanager, { ...body, nfcTagId: 'nfc-forge-laser-01' })).rejects.toThrow(
      MachineNfcTagTakenError
    )
  })
})

describe('UpdateMachineUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  const usecase = (options: { found?: typeof MACHINE | null; wearer?: typeof MACHINE | null }) =>
    new UpdateMachineUsecase(
      stub<IMachineRepository>({
        findById: vi.fn().mockResolvedValue(options.found === undefined ? MACHINE : options.found),
        findByNfcTag: vi.fn().mockResolvedValue(options.wearer ?? null),
        update: vi.fn(async (_id, patch) => machineFixture({ ...MACHINE, ...patch })),
      }),
      CLOCK
    )

  it('hides a machine of another atelier behind a 404', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })

    await expect(usecase({}).execute(stranger, MACHINE.id, { name: 'Renommée' })).rejects.toThrow(MachineUnknownError)
  })

  it('lets a machine keep the tag it already carries', async () => {
    const updated = await usecase({ wearer: MACHINE }).execute(fabmanager, MACHINE.id, {
      nfcTagId: 'nfc-forge-laser-01',
    })

    expect(updated.nfcTagId).toBe('nfc-forge-laser-01')
  })

  it('refuses a tag another machine carries', async () => {
    const other = machineFixture({ id: 'machine-other', nfcTagId: 'nfc-forge-laser-01' })

    await expect(
      usecase({ wearer: other }).execute(fabmanager, MACHINE.id, { nfcTagId: 'nfc-forge-laser-01' })
    ).rejects.toThrow(MachineNfcTagTakenError)
  })

  it('takes an explicit null as unsticking the tag', async () => {
    const updated = await usecase({}).execute(fabmanager, MACHINE.id, { nfcTagId: null })

    expect(updated.nfcTagId).toBeNull()
  })
})
