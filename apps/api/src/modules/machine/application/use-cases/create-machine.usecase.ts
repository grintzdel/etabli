import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isFabmanagerOf } from '../../../../shared/domain/permissions.ts'
import { MachineStatus } from '../../domain/constants/machine.constant.ts'
import type { MachineEntity } from '../../domain/entities/machine.entity.ts'
import { NotYourAtelierError } from '../../domain/errors/machine.errors.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../domain/repositories/machine.repository.token.ts'
import type { CreateMachineBody } from '../../presentation/dtos/create-machine.request.dto.ts'

@Injectable()
export class CreateMachineUsecase {
  constructor(
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(body: CreateMachineBody): Promise<MachineEntity> {
    const user = this.authContext.user
    if (!isFabmanagerOf(user, body.atelierId)) throw new NotYourAtelierError(body.atelierId)

    return this.machineRepository.insert({
      ...body,
      id: randomUUID(),
      status: MachineStatus.AVAILABLE,
      checkInToken: randomUUID(),
      createdAt: this.clock.now(),
    })
  }
}
