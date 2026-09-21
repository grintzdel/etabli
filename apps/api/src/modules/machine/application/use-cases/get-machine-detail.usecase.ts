import { Inject, Injectable } from '@nestjs/common'

import type { MachineWithAtelier } from '../../domain/entities/machine.entity.ts'
import { MachineUnknownError } from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../domain/repositories/machine.repository.token.ts'

@Injectable()
export class GetMachineDetailUsecase {
  constructor(@Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository) {}

  async execute(machineId: string): Promise<MachineWithAtelier> {
    const machine = await this.machineRepository.findPublicById(machineId)
    if (machine === null) throw new MachineUnknownError(machineId)

    return machine
  }
}
