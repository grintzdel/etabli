import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isFabmanagerOf } from '../../../../shared/domain/permissions.ts'
import type { MachineEntity } from '../../domain/entities/machine.entity.ts'
import { MachineUnknownError } from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../domain/repositories/machine.repository.token.ts'

@Injectable()
export class RegenerateCheckInTokenUsecase {
  constructor(
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, machineId: string): Promise<MachineEntity> {
    const machine = await this.machineRepository.findById(machineId)
    if (machine === null || !isFabmanagerOf(user, machine.atelierId)) throw new MachineUnknownError(machineId)

    const updated = await this.machineRepository.update(machineId, { checkInToken: randomUUID() }, this.clock.now())
    if (updated === null) throw new MachineUnknownError(machineId)
    return updated
  }
}
