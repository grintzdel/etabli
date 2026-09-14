import { AuthContext } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { MyCertification } from '../../../domain/certification.schema'
import { CertificationRepository } from '../../../infrastructure/certification.repository'
import { MachineDirectory } from '../../ports/machine-directory'

export const listMyCertifications = (): Effect.Effect<
  ReadonlyArray<MyCertification>,
  RepoError,
  AuthContext | CertificationRepository | MachineDirectory
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* CertificationRepository
    const directory = yield* MachineDirectory

    const atelierIds = auth.memberships.map((membership) => membership.atelierId)
    if (atelierIds.length === 0) return []

    const machines = yield* directory.listForAteliers(atelierIds)
    const certifications = yield* repository.listForUser(auth.userId)
    const byMachine = new Map(certifications.map((certification) => [certification.machineId, certification]))

    return machines
      .filter((machine) => machine.requiresCertification && !machine.retired)
      .map((machine): MyCertification => {
        const certification = byMachine.get(machine.machineId)
        return {
          certificationId: certification?.id ?? null,
          machineId: machine.machineId,
          machineName: machine.machineName,
          atelierId: machine.atelierId,
          atelierName: machine.atelierName,
          atelierSlug: machine.atelierSlug,
          status: certification?.status ?? 'NONE',
          requestedAt: certification?.requestedAt ?? null,
          decidedAt: certification?.decidedAt ?? null,
        }
      })
      .toSorted((a, b) => a.atelierName.localeCompare(b.atelierName) || a.machineName.localeCompare(b.machineName))
  })
