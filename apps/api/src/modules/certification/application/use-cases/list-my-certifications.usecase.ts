import { Inject, Injectable } from '@nestjs/common'

import type { IAuthContext } from '../../../../shared/domain/auth-context.interface.ts'
import { AUTH_CONTEXT } from '../../../../shared/domain/auth-context.token.ts'
import { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { MyCertificationStatus } from '../../domain/constants/certification.constant.ts'
import type { MyCertification } from '../../domain/entities/certification.entity.ts'
import type { ICertificationRepository } from '../../domain/repositories/certification.repository.interface.ts'
import { CERTIFICATION_REPOSITORY } from '../../domain/repositories/certification.repository.token.ts'

@Injectable()
export class ListMyCertificationsUsecase {
  constructor(
    @Inject(CERTIFICATION_REPOSITORY) private readonly certificationRepository: ICertificationRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(AUTH_CONTEXT) private readonly authContext: IAuthContext
  ) {}

  async execute(): Promise<ReadonlyArray<MyCertification>> {
    const user = this.authContext.user
    const atelierIds = user.memberships.map((membership) => membership.atelierId)
    if (atelierIds.length === 0) return []

    const machines = await this.machineRepository.listForAteliers(atelierIds)
    const certifications = await this.certificationRepository.listForUser(user.id)
    const byMachine = new Map(certifications.map((certification) => [certification.machineId, certification]))

    return machines
      .filter((machine) => machine.requiresCertification && machine.status !== MachineStatus.RETIRED)
      .map((machine): MyCertification => {
        const certification = byMachine.get(machine.id)
        return {
          certificationId: certification?.id ?? null,
          machineId: machine.id,
          machineName: machine.name,
          atelierId: machine.atelierId,
          atelierName: machine.atelierName,
          atelierSlug: machine.atelierSlug,
          status: certification?.status ?? MyCertificationStatus.NONE,
          requestedAt: certification?.requestedAt ?? null,
          decidedAt: certification?.decidedAt ?? null,
        }
      })
      .toSorted((a, b) => a.atelierName.localeCompare(b.atelierName) || a.machineName.localeCompare(b.machineName))
  }
}
