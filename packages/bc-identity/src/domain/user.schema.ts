import type { AuthMembership } from '@etabli/shared/auth-context'
import { AuthMembershipSchema, PlatformRoleSchema } from '@etabli/shared/auth-context'
import { UserId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

import { MAX_PRACTICES, PASSWORD_MIN_LENGTH, UserStatus } from './user.constants'

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

export const Practice = Schema.Array(Schema.Trim.pipe(Schema.minLength(1)))
  .pipe(Schema.minItems(1), Schema.maxItems(MAX_PRACTICES))
  .annotations({ message: () => 'Déclarez au moins une pratique' })

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
  practice: Schema.Array(Schema.String),
  onboardingCompletedAt: Schema.NullOr(Schema.DateTimeUtc),
  memberships: Schema.Array(AuthMembershipSchema),
  createdAt: Schema.DateTimeUtc,
})
export type CurrentUser = Schema.Schema.Type<typeof CurrentUserSchema>

export const RegisterPayloadSchema = Schema.Struct({
  email: Email,
  password: Password,
  displayName: DisplayName,
})
export type RegisterPayload = Schema.Schema.Type<typeof RegisterPayloadSchema>

export const UpdateProfileSchema = Schema.Struct({
  displayName: Schema.optional(DisplayName),
  practice: Schema.optional(Practice),
})
export type UpdateProfile = Schema.Schema.Type<typeof UpdateProfileSchema>

export const ChangePasswordSchema = Schema.Struct({
  currentPassword: Schema.String,
  newPassword: Password,
})
export type ChangePassword = Schema.Schema.Type<typeof ChangePasswordSchema>

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

export const toCurrentUser = (user: User, memberships: ReadonlyArray<AuthMembership> = []): CurrentUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  platformRole: user.platformRole,
  practice: user.practice,
  onboardingCompletedAt: user.onboardingCompletedAt,
  memberships,
  createdAt: user.createdAt,
})

export const AdminUserSchema = Schema.Struct({
  id: UserId,
  email: Schema.String,
  displayName: Schema.String,
  platformRole: PlatformRoleSchema,
  status: UserStatusSchema,
  practice: Schema.Array(Schema.String),
  onboardingCompletedAt: Schema.NullOr(Schema.DateTimeUtc),
  createdAt: Schema.DateTimeUtc,
})
export type AdminUser = Schema.Schema.Type<typeof AdminUserSchema>

export const AdminUsersParamsSchema = Schema.Struct({
  search: Schema.optional(Schema.Trim.pipe(Schema.minLength(1))),
  platformRole: Schema.optional(PlatformRoleSchema),
  status: Schema.optional(UserStatusSchema),
})
export type AdminUsersParams = Schema.Schema.Type<typeof AdminUsersParamsSchema>

export const UpdateAdminUserSchema = Schema.Struct({
  platformRole: Schema.optional(PlatformRoleSchema),
  status: Schema.optional(UserStatusSchema),
})
export type UpdateAdminUser = Schema.Schema.Type<typeof UpdateAdminUserSchema>

export const toAdminUser = (user: User): AdminUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  platformRole: user.platformRole,
  status: user.status,
  practice: user.practice,
  onboardingCompletedAt: user.onboardingCompletedAt,
  createdAt: user.createdAt,
})
