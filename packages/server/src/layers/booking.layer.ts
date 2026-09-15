import { AtelierRepository } from '@etabli/bc-atelier'
import { CertificationChecker, MachineCatalog } from '@etabli/bc-booking'
import { CertificationRepository, CertificationStatus } from '@etabli/bc-certification'
import type { MachineId, UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export const MachineCatalogLive = Layer.effect(
  MachineCatalog,
  Effect.map(AtelierRepository, (repository) => {
    const find = (machineId: MachineId) =>
      Effect.gen(function* () {
        const machine = yield* repository.findMachineById(machineId)
        if (machine === null) return null
        const atelier = yield* repository.findAnyById(machine.atelierId)
        if (atelier === null) return null
        return {
          machineId: machine.id,
          machineName: machine.name,
          atelierId: atelier.id,
          atelierName: atelier.name,
          atelierSlug: atelier.slug,
          status: machine.status,
          requiresCertification: machine.requiresCertification,
          slotDurationMinutes: machine.slotDurationMinutes,
          nfcTagId: machine.nfcTagId,
        }
      })

    return MachineCatalog.of({
      find,
      findMany: (machineIds: ReadonlyArray<MachineId>) =>
        Effect.forEach([...new Set(machineIds)], find, { concurrency: 'unbounded' }).pipe(
          Effect.map((machines) => machines.filter((machine) => machine !== null))
        ),
    })
  })
)

export const CertificationCheckerLive = Layer.effect(
  CertificationChecker,
  Effect.map(CertificationRepository, (repository) =>
    CertificationChecker.of({
      isCertified: (userId: UserId, machineId: MachineId) =>
        repository
          .findForUserAndMachine(userId, machineId)
          .pipe(Effect.map((certification) => certification?.status === CertificationStatus.GRANTED)),
    })
  )
)
