import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { AtelierStatus } from '../../domain/constants/atelier.constant.ts'
import { type AdminAtelier, toAdminAtelier } from '../../domain/entities/atelier.entity.ts'
import { AtelierSlugTakenError } from '../../domain/errors/atelier.errors.ts'
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../domain/repositories/atelier.repository.token.ts'
import type { CreateAtelierBody } from '../../presentation/dtos/create-atelier.request.dto.ts'

@Injectable()
export class CreateAtelierUsecase {
  constructor(
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(body: CreateAtelierBody): Promise<AdminAtelier> {
    const taken = await this.atelierRepository.findAnyBySlug(body.slug)
    if (taken !== null) throw new AtelierSlugTakenError(body.slug)

    const atelier = await this.atelierRepository.insert({
      ...body,
      id: randomUUID(),
      status: AtelierStatus.DRAFT,
      createdAt: this.clock.now(),
    })

    return toAdminAtelier(atelier, 0)
  }
}
