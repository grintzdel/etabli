import { AtelierRepository } from '@etabli/bc-atelier'
import { CertificationChecker, MachineCatalog, MemberRoster } from '@etabli/bc-booking'
import { CertificationRepository, CertificationStatus } from '@etabli/bc-certification'
import { UserRepository } from '@etabli/bc-identity'
import type { AtelierId, MachineId, UserId } from '@etabli/shared/schema'
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

    const findMany = (machineIds: ReadonlyArray<MachineId>) =>
      Effect.forEach([...new Set(machineIds)], find, { concurrency: 'unbounded' }).pipe(
        Effect.map((machines) => machines.filter((machine) => machine !== null))
      )

    const listForAteliers = (atelierIds: ReadonlyArray<AtelierId>) =>
      Effect.forEach([...new Set(atelierIds)], (atelierId) => repository.listMachines(atelierId), {
        concurrency: 'unbounded',
      }).pipe(Effect.flatMap((lists) => findMany(lists.flat().map((machine) => machine.id))))

    return MachineCatalog.of({
      find,
      findMany,
      listForAteliers,
      listAll: () =>
        repository.listAll().pipe(Effect.flatMap((ateliers) => listForAteliers(ateliers.map((a) => a.id)))),
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

export const MemberRosterLive = Layer.effect(
  MemberRoster,
  Effect.map(UserRepository, (repository) =>
    MemberRoster.of({
      namesOf: (userIds: ReadonlyArray<UserId>) =>
        Effect.forEach(
          [...new Set(userIds)],
          (userId) => Effect.map(repository.findById(userId), (user) => [userId, user?.displayName ?? null] as const),
          { concurrency: 'unbounded' }
        ).pipe(
          Effect.map(
            (pairs) =>
              new Map(
                pairs.flatMap(([userId, name]) => (name === null ? [] : [[userId, name] as const]))
              ) as ReadonlyMap<UserId, string>
          )
        ),
    })
  )
)
