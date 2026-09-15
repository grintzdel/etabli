import type { UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { updateAdminUser } from '../application/commands/update-admin-user/update-admin-user.command'
import { listUsers } from '../application/queries/list-users/list-users.query'
import type { AdminUsersParams, UpdateAdminUser } from '../domain/user.schema'

export const adminUsersHandlers = {
  listUsers: ({ urlParams }: { readonly urlParams: AdminUsersParams }) =>
    listUsers(urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  updateUser: ({ path, payload }: { readonly path: { readonly id: UserId }; readonly payload: UpdateAdminUser }) =>
    updateAdminUser(path.id, payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
