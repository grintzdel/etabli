import { Inject, Injectable } from '@nestjs/common'

import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import type { AdminAtelier } from '../../domain/entities/atelier.entity.ts'
import { AtelierUnknownError } from '../../domain/errors/atelier.errors.ts'
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../domain/repositories/atelier.repository.token.ts'
import type { SetAtelierStatusBody } from '../../presentation/dtos/set-atelier-status.request.dto.ts'

@Injectable()
export class SetAtelierStatusUsecase {
  constructor(
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(atelierId: string, body: SetAtelierStatusBody): Promise<AdminAtelier> {
    const updated = await this.atelierRepository.updateStatus(atelierId, body.status, this.clock.now())
    if (updated === null) throw new AtelierUnknownError(atelierId)
    return updated
  }
}
