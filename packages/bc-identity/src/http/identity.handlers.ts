import * as Effect from 'effect/Effect'

import { loginUser } from '../application/commands/login-user/login-user.command'
import { registerUser } from '../application/commands/register-user/register-user.command'
import { getCurrentUser } from '../application/queries/get-current-user/get-current-user.query'
import type { LoginPayload, RegisterPayload } from '../domain/user.schema'

// A repository failure is not part of the wire contract: dying answers 500 without
// serialising RepoError.cause back to the caller.
export const identityHandlers = {
  register: ({ payload }: { readonly payload: RegisterPayload }) =>
    registerUser(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  login: ({ payload }: { readonly payload: LoginPayload }) =>
    loginUser(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  me: () => getCurrentUser.pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
