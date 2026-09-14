import { AtelierRepository } from '@etabli/bc-atelier'
import { MachineDirectory, MemberDirectory } from '@etabli/bc-certification'
import { UserRepository } from '@etabli/bc-identity'
import type { AtelierId, MachineId, UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export const MachineDirectoryLive = Layer.effect(
  MachineDirectory,
  Effect.map(AtelierRepository, (repository) => {
    const ofAtelier = (atelierId: AtelierId) =>
      Effect.gen(function* () {
        const atelier = yield* repository.findAnyById(atelierId)
        if (atelier === null) return []
        const machines = yield* repository.listMachines(atelierId)
        return machines.map((machine) => ({
          machineId: machine.id,
          machineName: machine.name,
          atelierId: atelier.id,
          atelierName: atelier.name,
          atelierSlug: atelier.slug,
          requiresCertification: machine.requiresCertification,
          retired: machine.status === 'RETIRED',
        }))
      })

    const listForAteliers = (atelierIds: ReadonlyArray<AtelierId>) =>
      Effect.map(Effect.forEach(atelierIds, ofAtelier), (lists) => lists.flat())

    const findMany = (machineIds: ReadonlyArray<MachineId>) =>
      Effect.gen(function* () {
        if (machineIds.length === 0) return []
        const wanted = new Set<string>(machineIds)
        const atelierIds = yield* Effect.forEach(machineIds, (machineId) =>
          Effect.map(repository.findMachineById(machineId), (machine) => machine?.atelierId ?? null)
        )
        const unique = [...new Set(atelierIds.filter((id): id is AtelierId => id !== null))]
        const machines = yield* listForAteliers(unique)
        return machines.filter((machine) => wanted.has(machine.machineId))
      })

    return MachineDirectory.of({
      listForAteliers,
      findMany,
      find: (machineId: MachineId) => Effect.map(findMany([machineId]), (machines) => machines[0] ?? null),
    })
  })
)

export const MemberDirectoryLive = Layer.effect(
  MemberDirectory,
  Effect.map(UserRepository, (repository) =>
    MemberDirectory.of({
      namesOf: (userIds: ReadonlyArray<UserId>) =>
        Effect.map(
          Effect.forEach([...new Set(userIds)], (userId) =>
            Effect.map(repository.findById(userId), (user) => [userId, user?.displayName ?? null] as const)
          ),
          (pairs) =>
            new Map(pairs.flatMap(([userId, name]) => (name === null ? [] : [[userId, name] as const]))) as ReadonlyMap<
              UserId,
              string
            >
        ),
    })
  )
)
