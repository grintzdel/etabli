import { Inject, Injectable } from '@nestjs/common'

import type { AtelierSummary } from '../../domain/entities/atelier.entity.ts'
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../domain/repositories/atelier.repository.token.ts'
import type { ListAteliersQuery } from '../../presentation/dtos/list-ateliers.request.dto.ts'

@Injectable()
export class ListAteliersUsecase {
  constructor(@Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository) {}

  async execute(query: ListAteliersQuery): Promise<ReadonlyArray<AtelierSummary>> {
    return this.atelierRepository.listPublished(query)
  }
}
