import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { fabmanagedAtelierIds } from '../../../../shared/domain/permissions.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.token.ts'
import { QUEUE_RANK, UNKNOWN_MEMBER } from '../../domain/constants/certification.constant.ts'
import type { CertificationRequest } from '../../domain/entities/certification.entity.ts'
import type { ICertificationRepository } from '../../domain/repositories/certification.repository.interface.ts'
import { CERTIFICATION_REPOSITORY } from '../../domain/repositories/certification.repository.token.ts'

@Injectable()
export class ListCertificationQueueUsecase {
  constructor(
    @Inject(CERTIFICATION_REPOSITORY) private readonly certificationRepository: ICertificationRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository
  ) {}

  async execute(user: AuthUser): Promise<ReadonlyArray<CertificationRequest>> {
    const fabmanaged = fabmanagedAtelierIds(user)
    if (fabmanaged.length === 0) return []

    const machines = await this.machineRepository.listForAteliers(fabmanaged)
    const byId = new Map(machines.map((machine) => [machine.id, machine]))

    const certifications = await this.certificationRepository.listForMachines(machines.map((machine) => machine.id))
    const names = await this.userRepository.namesOf(certifications.map((certification) => certification.userId))

    return certifications
      .flatMap((certification): ReadonlyArray<CertificationRequest> => {
        const machine = byId.get(certification.machineId)
        if (machine === undefined) return []
        return [
          {
            id: certification.id,
            userId: certification.userId,
            memberName: names.get(certification.userId) ?? UNKNOWN_MEMBER,
            machineId: machine.id,
            machineName: machine.name,
            atelierId: machine.atelierId,
            atelierName: machine.atelierName,
            status: certification.status,
            requestedAt: certification.requestedAt,
            decidedAt: certification.decidedAt,
          },
        ]
      })
      .toSorted(
        (a, b) => QUEUE_RANK[a.status] - QUEUE_RANK[b.status] || a.requestedAt.getTime() - b.requestedAt.getTime()
      )
  }
}
