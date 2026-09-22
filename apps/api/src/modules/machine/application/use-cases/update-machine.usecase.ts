import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isFabmanagerOf } from '../../../../shared/domain/permissions.ts'
import type { MachineEntity } from '../../domain/entities/machine.entity.ts'
import { MachineUnknownError } from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../domain/repositories/machine.repository.token.ts'
import type { UpdateMachineBody } from '../../presentation/dtos/update-machine.request.dto.ts'

@Injectable()
export class UpdateMachineUsecase {
  constructor(
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(machineId: string, patch: UpdateMachineBody): Promise<MachineEntity> {
    const user = this.authContext.user
    const machine = await this.machineRepository.findById(machineId)
    if (machine === null || !isFabmanagerOf(user, machine.atelierId)) throw new MachineUnknownError(machineId)

    const updated = await this.machineRepository.update(machineId, patch, this.clock.now())
    if (updated === null) throw new MachineUnknownError(machineId)
    return updated
  }
}
