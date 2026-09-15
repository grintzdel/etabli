import { Inject, Injectable } from '@nestjs/common'

import type { AdminAtelier } from '../../domain/entities/atelier.entity.ts'
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../domain/repositories/atelier.repository.token.ts'

@Injectable()
export class ListAllAteliersUsecase {
  constructor(@Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository) {}

  async execute(): Promise<ReadonlyArray<AdminAtelier>> {
    return this.atelierRepository.listAll()
  }
}
