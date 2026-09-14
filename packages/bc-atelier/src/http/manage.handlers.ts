import type { MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { createMachine } from '../application/commands/create-machine/create-machine.command'
import { updateMachine } from '../application/commands/update-machine/update-machine.command'
import { listManagedParcs } from '../application/queries/list-managed-parcs/list-managed-parcs.query'
import type { CreateMachine, UpdateMachine } from '../domain/atelier.schema'

export const manageHandlers = {
  listParcs: () => listManagedParcs().pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  createMachine: ({ payload }: { readonly payload: CreateMachine }) =>
    createMachine(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  updateMachine: ({ path, payload }: { readonly path: { readonly id: MachineId }; readonly payload: UpdateMachine }) =>
    updateMachine(path.id, payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
