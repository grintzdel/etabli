import { PlatformRoleSchema } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

import { PASSWORD_MIN_LENGTH, UserStatus } from './user.constants'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Email = Schema.transform(Schema.String, Schema.String.pipe(Schema.pattern(EMAIL_PATTERN)), {
  strict: true,
  decode: (raw) => raw.trim().toLowerCase(),
  encode: (normalized) => normalized,
})
  .pipe(Schema.brand('Email'))
  .annotations({ message: () => 'Adresse e-mail invalide' })
export type Email = Schema.Schema.Type<typeof Email>

export const Password = Schema.String.pipe(Schema.minLength(PASSWORD_MIN_LENGTH)).annotations({
  message: () => `Le mot de passe fait au moins ${PASSWORD_MIN_LENGTH} caractères`,
})

export const DisplayName = Schema.Trim.pipe(Schema.minLength(1)).annotations({
  message: () => 'Le nom affiché est obligatoire',
})

export const UserStatusSchema = Schema.Literal(UserStatus.ACTIVE, UserStatus.SUSPENDED)

export const UserSchema = Schema.Struct({
  id: UserId,
  email: Email,
  passwordHash: Schema.String,
  displayName: Schema.String,
  platformRole: PlatformRoleSchema,
  practice: Schema.Array(Schema.String),
  onboardingCompletedAt: Schema.NullOr(Schema.DateTimeUtc),
  status: UserStatusSchema,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
})
export type User = Schema.Schema.Type<typeof UserSchema>

export const CurrentUserSchema = Schema.Struct({
  id: UserId,
  email: Schema.String,
  displayName: Schema.String,
  platformRole: PlatformRoleSchema,
  createdAt: Schema.DateTimeUtc,
})
export type CurrentUser = Schema.Schema.Type<typeof CurrentUserSchema>

export const RegisterPayloadSchema = Schema.Struct({
  email: Email,
  password: Password,
  displayName: DisplayName,
})
export type RegisterPayload = Schema.Schema.Type<typeof RegisterPayloadSchema>

export const LoginPayloadSchema = Schema.Struct({
  email: Email,
  password: Schema.String,
})
export type LoginPayload = Schema.Schema.Type<typeof LoginPayloadSchema>

export const SessionSchema = Schema.Struct({
  token: Schema.String,
  expiresAt: Schema.DateTimeUtc,
  user: CurrentUserSchema,
})
export type Session = Schema.Schema.Type<typeof SessionSchema>

export const toCurrentUser = (user: User): CurrentUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  platformRole: user.platformRole,
  createdAt: user.createdAt,
})
