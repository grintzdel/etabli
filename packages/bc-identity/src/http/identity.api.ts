import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { CurrentUser, RegisterInput, Session } from '@etabli/contract'
import { routes } from '@etabli/contract'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { AccountSuspendedError, EmailAlreadyTakenError, InvalidCredentialsError } from '../domain/errors'
import { CurrentUserSchema, LoginPayloadSchema, RegisterPayloadSchema, SessionSchema } from '../domain/user.schema'
import { AuthMiddleware } from './auth.middleware'

export const identityContractParity: AssertEquals<Schema.Schema.Encoded<typeof SessionSchema>, Session> = true
export const currentUserContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof CurrentUserSchema>,
  CurrentUser
> = true
export const registerContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof RegisterPayloadSchema>,
  RegisterInput
> = true

export const identityApiGroup = HttpApiGroup.make('identity')
  .add(
    HttpApiEndpoint.post('register', routes.auth.register)
      .setPayload(RegisterPayloadSchema)
      .addSuccess(SessionSchema, { status: 201 })
      .addError(EmailAlreadyTakenError)
  )
  .add(
    HttpApiEndpoint.post('login', routes.auth.login)
      .setPayload(LoginPayloadSchema)
      .addSuccess(SessionSchema)
      .addError(InvalidCredentialsError)
      .addError(AccountSuspendedError)
  )
  .add(HttpApiEndpoint.get('me', routes.auth.me).addSuccess(CurrentUserSchema).middleware(AuthMiddleware))
