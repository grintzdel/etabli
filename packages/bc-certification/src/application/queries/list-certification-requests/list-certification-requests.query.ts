import { AuthContext, MembershipRole } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import { CertificationStatus } from '../../../domain/certification.constants'
import type { CertificationRequest } from '../../../domain/certification.schema'
import { CertificationRepository } from '../../../infrastructure/certification.repository'
import { MachineDirectory } from '../../ports/machine-directory'
import { MemberDirectory } from '../../ports/member-directory'

const RANK: Readonly<Record<CertificationRequest['status'], number>> = {
  [CertificationStatus.PENDING]: 0,
  [CertificationStatus.GRANTED]: 1,
  [CertificationStatus.REVOKED]: 2,
}

export const listCertificationRequests = (): Effect.Effect<
  ReadonlyArray<CertificationRequest>,
  RepoError,
  AuthContext | CertificationRepository | MachineDirectory | MemberDirectory
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* CertificationRepository
    const directory = yield* MachineDirectory
    const members = yield* MemberDirectory

    const fabmanaged = auth.memberships
      .filter((membership) => membership.role === MembershipRole.FABMANAGER)
      .map((membership) => membership.atelierId)
    if (fabmanaged.length === 0) return []

    const machines = yield* directory.listForAteliers(fabmanaged)
    const byId = new Map(machines.map((machine) => [machine.machineId, machine]))

    const certifications = yield* repository.listForMachines(machines.map((machine) => machine.machineId))
    const names = yield* members.namesOf(certifications.map((certification) => certification.userId))

    return certifications
      .flatMap((certification): ReadonlyArray<CertificationRequest> => {
        const machine = byId.get(certification.machineId)
        if (machine === undefined) return []
        return [
          {
            id: certification.id,
            userId: certification.userId,
            memberName: names.get(certification.userId) ?? 'Compte supprimé',
            machineId: machine.machineId,
            machineName: machine.machineName,
            atelierId: machine.atelierId,
            atelierName: machine.atelierName,
            status: certification.status,
            requestedAt: certification.requestedAt,
            decidedAt: certification.decidedAt,
          },
        ]
      })
      .toSorted((a, b) => RANK[a.status] - RANK[b.status] || a.requestedAt.epochMillis - b.requestedAt.epochMillis)
  })
