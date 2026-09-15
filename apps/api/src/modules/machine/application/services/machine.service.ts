import { Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { MachineEntity, ManagedParc } from '../../domain/entities/machine.entity.ts'
import type { CreateMachineBody } from '../../presentation/dtos/create-machine.request.dto.ts'
import type { UpdateMachineBody } from '../../presentation/dtos/update-machine.request.dto.ts'
import { CreateMachineUsecase } from '../use-cases/create-machine.usecase.ts'
import { ListManagedParcsUsecase } from '../use-cases/list-managed-parcs.usecase.ts'
import { UpdateMachineUsecase } from '../use-cases/update-machine.usecase.ts'

@Injectable()
export class MachineService {
  constructor(
    private readonly listManagedParcsUsecase: ListManagedParcsUsecase,
    private readonly createMachineUsecase: CreateMachineUsecase,
    private readonly updateMachineUsecase: UpdateMachineUsecase
  ) {}

  public async listManagedParcs(user: AuthUser): Promise<ReadonlyArray<ManagedParc>> {
    return this.listManagedParcsUsecase.execute(user)
  }

  public async create(user: AuthUser, body: CreateMachineBody): Promise<MachineEntity> {
    return this.createMachineUsecase.execute(user, body)
  }

  public async update(user: AuthUser, machineId: string, body: UpdateMachineBody): Promise<MachineEntity> {
    return this.updateMachineUsecase.execute(user, machineId, body)
  }
}
