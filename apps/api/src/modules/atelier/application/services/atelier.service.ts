import { Injectable } from '@nestjs/common'

import type { AdminAtelier, AtelierDetail, AtelierSummary } from '../../domain/entities/atelier.entity.ts'
import type { CreateAtelierBody } from '../../presentation/dtos/create-atelier.request.dto.ts'
import type { ListAteliersQuery } from '../../presentation/dtos/list-ateliers.request.dto.ts'
import type { SetAtelierStatusBody } from '../../presentation/dtos/set-atelier-status.request.dto.ts'
import { CreateAtelierUsecase } from '../use-cases/create-atelier.usecase.ts'
import { GetAtelierBySlugUsecase } from '../use-cases/get-atelier-by-slug.usecase.ts'
import { ListAllAteliersUsecase } from '../use-cases/list-all-ateliers.usecase.ts'
import { ListAteliersUsecase } from '../use-cases/list-ateliers.usecase.ts'
import { SetAtelierStatusUsecase } from '../use-cases/set-atelier-status.usecase.ts'

@Injectable()
export class AtelierService {
  constructor(
    private readonly listAteliersUsecase: ListAteliersUsecase,
    private readonly getAtelierBySlugUsecase: GetAtelierBySlugUsecase,
    private readonly listAllAteliersUsecase: ListAllAteliersUsecase,
    private readonly createAtelierUsecase: CreateAtelierUsecase,
    private readonly setAtelierStatusUsecase: SetAtelierStatusUsecase
  ) {}

  public async list(query: ListAteliersQuery): Promise<ReadonlyArray<AtelierSummary>> {
    return this.listAteliersUsecase.execute(query)
  }

  public async getBySlug(slug: string): Promise<AtelierDetail> {
    return this.getAtelierBySlugUsecase.execute(slug)
  }

  public async listAll(): Promise<ReadonlyArray<AdminAtelier>> {
    return this.listAllAteliersUsecase.execute()
  }

  public async create(body: CreateAtelierBody): Promise<AdminAtelier> {
    return this.createAtelierUsecase.execute(body)
  }

  public async setStatus(atelierId: string, body: SetAtelierStatusBody): Promise<AdminAtelier> {
    return this.setAtelierStatusUsecase.execute(atelierId, body)
  }
}
