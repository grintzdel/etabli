import { describe, expect, it, vi } from 'vitest'

import { machineFixture } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import { MachineUnknownError } from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { GetMachineDetailUsecase } from './get-machine-detail.usecase.ts'

describe('GetMachineDetailUsecase', () => {
  it('hands the fiche the repository judged public', async () => {
    const machine = machineFixture()
    const usecase = new GetMachineDetailUsecase(
      stub<IMachineRepository>({ findPublicById: vi.fn().mockResolvedValue(machine) })
    )

    expect(await usecase.execute(machine.id)).toEqual(machine)
  })

  it('refuses with a 404 what the repository withholds', async () => {
    const usecase = new GetMachineDetailUsecase(
      stub<IMachineRepository>({ findPublicById: vi.fn().mockResolvedValue(null) })
    )

    await expect(usecase.execute('machine-1')).rejects.toThrow(MachineUnknownError)
  })

  it('never falls back on the unfiltered read', async () => {
    const findById = vi.fn()
    const usecase = new GetMachineDetailUsecase(
      stub<IMachineRepository>({ findById, findPublicById: vi.fn().mockResolvedValue(null) })
    )

    await expect(usecase.execute('machine-1')).rejects.toThrow(MachineUnknownError)
    expect(findById).not.toHaveBeenCalled()
  })
})
