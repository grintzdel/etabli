import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import { fabmanagedAtelierIds } from '../../../../shared/domain/permissions.ts'
import type { IAtelierRepository } from '../../../atelier/domain/repositories/atelier.repository.interface.ts'
import { ATELIER_REPOSITORY } from '../../../atelier/domain/repositories/atelier.repository.token.ts'
import type { ManagedParc } from '../../domain/entities/machine.entity.ts'
import type { IMachineRepository } from '../../domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../domain/repositories/machine.repository.token.ts'

@Injectable()
export class ListManagedParcsUsecase {
  constructor(
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(): Promise<ReadonlyArray<ManagedParc>> {
    const user = this.authContext.user
    const parcs = await Promise.all(
      fabmanagedAtelierIds(user).map(async (atelierId) => {
        const atelier = await this.atelierRepository.findAnyById(atelierId)
        if (atelier === null) return null

        return {
          atelier: { id: atelier.id, slug: atelier.slug, name: atelier.name, status: atelier.status },
          machines: await this.machineRepository.listForAtelier(atelier.id),
        }
      })
    )

    return parcs.filter((parc): parc is ManagedParc => parc !== null)
  }
}
