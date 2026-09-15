import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type {
  ChangePasswordInput,
  CurrentUser,
  MemberAtelier,
  RegisterInput,
  Session,
  UpdatePreferencesInput,
  UpdateProfileInput,
  UserPreferences,
} from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { AccountSuspendedError } from '@etabli/shared/errors'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { EmailAlreadyTakenError, InvalidCredentialsError, PreferredAtelierNotJoinedError } from '../domain/errors'
import { MemberAtelierSchema } from '../domain/member-atelier.schema'
import { UpdatePreferencesSchema, UserPreferencesSchema } from '../domain/preferences.schema'
import {
  ChangePasswordSchema,
  CurrentUserSchema,
  LoginPayloadSchema,
  RegisterPayloadSchema,
  SessionSchema,
  UpdateProfileSchema,
} from '../domain/user.schema'

export const identityContractParity: AssertEquals<Schema.Schema.Encoded<typeof SessionSchema>, Session> = true
export const currentUserContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof CurrentUserSchema>,
  CurrentUser
> = true
export const registerContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof RegisterPayloadSchema>,
  RegisterInput
> = true
export const preferencesContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof UserPreferencesSchema>,
  UserPreferences
> = true
export const updatePreferencesContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof UpdatePreferencesSchema>,
  UpdatePreferencesInput
> = true
export const memberAtelierContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof MemberAtelierSchema>,
  MemberAtelier
> = true
export const updateProfileContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof UpdateProfileSchema>,
  UpdateProfileInput
> = true
export const changePasswordContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof ChangePasswordSchema>,
  ChangePasswordInput
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
  .add(
    HttpApiEndpoint.patch('updateProfile', routes.auth.me)
      .setPayload(UpdateProfileSchema)
      .addSuccess(CurrentUserSchema)
      .middleware(AuthMiddleware)
  )
  .add(
    HttpApiEndpoint.post('changePassword', routes.auth.password)
      .setPayload(ChangePasswordSchema)
      .addSuccess(SessionSchema)
      .addError(InvalidCredentialsError)
      .middleware(AuthMiddleware)
  )
  .add(
    HttpApiEndpoint.get('preferences', routes.me.preferences)
      .addSuccess(UserPreferencesSchema)
      .middleware(AuthMiddleware)
  )
  .add(
    HttpApiEndpoint.get('myAteliers', routes.me.ateliers)
      .addSuccess(Schema.Array(MemberAtelierSchema))
      .middleware(AuthMiddleware)
  )
  .add(
    HttpApiEndpoint.patch('updatePreferences', routes.me.preferences)
      .setPayload(UpdatePreferencesSchema)
      .addSuccess(UserPreferencesSchema)
      .addError(PreferredAtelierNotJoinedError)
      .middleware(AuthMiddleware)
  )
