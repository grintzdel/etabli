import * as Effect from 'effect/Effect'

import { changePassword } from '../application/commands/change-password/change-password.command'
import { loginUser } from '../application/commands/login-user/login-user.command'
import { registerUser } from '../application/commands/register-user/register-user.command'
import { updatePreferences } from '../application/commands/update-preferences/update-preferences.command'
import { updateProfile } from '../application/commands/update-profile/update-profile.command'
import { getCurrentUser } from '../application/queries/get-current-user/get-current-user.query'
import { getPreferences } from '../application/queries/get-preferences/get-preferences.query'
import { listMyAteliers } from '../application/queries/list-my-ateliers/list-my-ateliers.query'
import type { UpdatePreferences } from '../domain/preferences.schema'
import type { ChangePassword, LoginPayload, RegisterPayload, UpdateProfile } from '../domain/user.schema'

// A repository failure is not part of the wire contract: dying answers 500 without
// serialising RepoError.cause back to the caller.
export const identityHandlers = {
  register: ({ payload }: { readonly payload: RegisterPayload }) =>
    registerUser(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  login: ({ payload }: { readonly payload: LoginPayload }) =>
    loginUser(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  me: () => getCurrentUser.pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  preferences: () => getPreferences.pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  myAteliers: () => listMyAteliers.pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  updateProfile: ({ payload }: { readonly payload: UpdateProfile }) =>
    updateProfile(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  changePassword: ({ payload }: { readonly payload: ChangePassword }) =>
    changePassword(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  updatePreferences: ({ payload }: { readonly payload: UpdatePreferences }) =>
    updatePreferences(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
