import { AtelierRepository } from '@etabli/bc-atelier'
import { MachineCatalog } from '@etabli/bc-booking'
import type { MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export const MachineCatalogLive = Layer.effect(
  MachineCatalog,
  Effect.map(AtelierRepository, (repository) =>
    MachineCatalog.of({
      find: (machineId: MachineId) =>
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
        }),
    })
  )
)
