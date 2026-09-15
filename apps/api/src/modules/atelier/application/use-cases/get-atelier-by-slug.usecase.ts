import { Inject, Injectable } from '@nestjs/common'

import { type AtelierDetail, toAtelierDetail } from '../../domain/entities/atelier.entity.ts'
import { AtelierNotFoundError } from '../../domain/errors/atelier.errors.ts'
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../domain/repositories/atelier.repository.token.ts'

@Injectable()
export class GetAtelierBySlugUsecase {
  constructor(@Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository) {}

  async execute(slug: string): Promise<AtelierDetail> {
    const atelier = await this.atelierRepository.findPublishedBySlug(slug)
    if (atelier === null) throw new AtelierNotFoundError(slug)

    return toAtelierDetail(atelier, await this.atelierRepository.listPublicMachines(atelier.id))
  }
}
