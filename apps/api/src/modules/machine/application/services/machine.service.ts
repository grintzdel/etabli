import { Injectable } from '@nestjs/common'

import type { MachineEntity, MachineWithAtelier, ManagedParc } from '../../domain/entities/machine.entity.ts'
import type { CreateMachineBody } from '../../presentation/dtos/create-machine.request.dto.ts'
import type { UpdateMachineBody } from '../../presentation/dtos/update-machine.request.dto.ts'
import { CreateMachineUsecase } from '../use-cases/create-machine.usecase.ts'
import { GetMachineDetailUsecase } from '../use-cases/get-machine-detail.usecase.ts'
import { ListManagedParcsUsecase } from '../use-cases/list-managed-parcs.usecase.ts'
import { RegenerateCheckInTokenUsecase } from '../use-cases/regenerate-check-in-token.usecase.ts'
import { UpdateMachineUsecase } from '../use-cases/update-machine.usecase.ts'

@Injectable()
export class MachineService {
  constructor(
    private readonly listManagedParcsUsecase: ListManagedParcsUsecase,
    private readonly createMachineUsecase: CreateMachineUsecase,
    private readonly updateMachineUsecase: UpdateMachineUsecase,
    private readonly getMachineDetailUsecase: GetMachineDetailUsecase,
    private readonly regenerateCheckInTokenUsecase: RegenerateCheckInTokenUsecase
  ) {}

  public async getDetail(machineId: string): Promise<MachineWithAtelier> {
    return this.getMachineDetailUsecase.execute(machineId)
  }

  public async listManagedParcs(): Promise<ReadonlyArray<ManagedParc>> {
    return this.listManagedParcsUsecase.execute()
  }

  public async create(body: CreateMachineBody): Promise<MachineEntity> {
    return this.createMachineUsecase.execute(body)
  }

  public async update(machineId: string, body: UpdateMachineBody): Promise<MachineEntity> {
    return this.updateMachineUsecase.execute(machineId, body)
  }

  public async regenerateCheckInToken(machineId: string): Promise<MachineEntity> {
    return this.regenerateCheckInTokenUsecase.execute(machineId)
  }
}
