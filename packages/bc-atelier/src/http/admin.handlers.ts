import type { AtelierId, UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { createAtelier } from '../application/commands/create-atelier/create-atelier.command'
import { setAtelierStatus } from '../application/commands/set-atelier-status/set-atelier-status.command'
import { setMembershipRole } from '../application/commands/set-membership-role/set-membership-role.command'
import { listAllAteliers } from '../application/queries/list-all-ateliers/list-all-ateliers.query'
import type { CreateAtelier, SetAtelierStatus, SetMembershipRole } from '../domain/atelier.schema'

export const adminHandlers = {
  listAteliers: () => listAllAteliers().pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  createAtelier: ({ payload }: { readonly payload: CreateAtelier }) =>
    createAtelier(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  setAtelierStatus: ({
    path,
    payload,
  }: {
    readonly path: { readonly id: AtelierId }
    readonly payload: SetAtelierStatus
  }) => setAtelierStatus(path.id, payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  setMembershipRole: ({
    path,
    payload,
  }: {
    readonly path: { readonly atelierId: AtelierId; readonly userId: UserId }
    readonly payload: SetMembershipRole
  }) =>
    setMembershipRole(path.atelierId, path.userId, payload).pipe(
      Effect.catchTag('RepoError', (error) => Effect.die(error))
    ),
}
