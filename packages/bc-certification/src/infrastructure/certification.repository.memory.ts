import type { CertificationId, MachineId, UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { CertificationStatus } from '../domain/certification.constants'
import type { Certification } from '../domain/certification.schema'
import type { CertificationRepositoryService } from './certification.repository'
import { CertificationRepository } from './certification.repository'

export interface CertificationRepositoryMemory extends CertificationRepositoryService {
  readonly certifications: Map<string, Certification>
}

export const makeCertificationRepositoryMemory = (): CertificationRepositoryMemory => {
  const certifications = new Map<string, Certification>()

  return {
    certifications,
    findById: (id: CertificationId) => Effect.sync(() => certifications.get(id) ?? null),
    findForUserAndMachine: (userId: UserId, machineId: MachineId) =>
      Effect.sync(
        () =>
          [...certifications.values()].find(
            (certification) => certification.userId === userId && certification.machineId === machineId
          ) ?? null
      ),
    listForUser: (userId: UserId) =>
      Effect.sync(() =>
        [...certifications.values()]
          .filter((certification) => certification.userId === userId)
          .toSorted((a, b) => b.requestedAt.epochMillis - a.requestedAt.epochMillis)
      ),
    listForMachines: (machineIds: ReadonlyArray<MachineId>) =>
      Effect.sync(() =>
        [...certifications.values()]
          .filter((certification) => machineIds.includes(certification.machineId))
          .toSorted((a, b) => a.requestedAt.epochMillis - b.requestedAt.epochMillis)
      ),
    insert: (certification) =>
      Effect.sync(() => {
        certifications.set(certification.id, certification)
        return certification
      }),
    reopen: (id: CertificationId, at) =>
      Effect.sync(() => {
        const certification = certifications.get(id)
        if (certification === undefined) return null
        const reopened = {
          ...certification,
          status: 'PENDING' as const,
          decidedAt: null,
          decidedBy: null,
          requestedAt: at,
        }
        certifications.set(id, reopened)
        return reopened
      }),
    decide: (id: CertificationId, status: CertificationStatus, decidedBy: UserId, at) =>
      Effect.sync(() => {
        const certification = certifications.get(id)
        if (certification === undefined) return null
        const decided = { ...certification, status, decidedBy, decidedAt: at }
        certifications.set(id, decided)
        return decided
      }),
  }
}

export const CertificationRepositoryMemoryLayer = Layer.sync(CertificationRepository, () =>
  CertificationRepository.of(makeCertificationRepositoryMemory())
)
