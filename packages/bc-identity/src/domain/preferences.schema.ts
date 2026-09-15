import { AtelierId, UserId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

import { DEFAULT_THEME, Theme } from './preferences.constants'

export const ThemeSchema = Schema.Literal(Theme.DARK, Theme.LIGHT, Theme.SYSTEM).annotations({
  message: () => 'Thème inconnu',
})

export const UserPreferencesSchema = Schema.Struct({
  userId: UserId,
  theme: ThemeSchema,
  defaultAtelierId: Schema.NullOr(AtelierId),
  updatedAt: Schema.NullOr(Schema.DateTimeUtc),
})
export type UserPreferences = Schema.Schema.Type<typeof UserPreferencesSchema>

export const UpdatePreferencesSchema = Schema.Struct({
  theme: Schema.optional(ThemeSchema),
  defaultAtelierId: Schema.optional(Schema.NullOr(AtelierId)),
})
export type UpdatePreferences = Schema.Schema.Type<typeof UpdatePreferencesSchema>

export const defaultPreferences = (userId: UserId): UserPreferences => ({
  userId,
  theme: DEFAULT_THEME,
  defaultAtelierId: null,
  updatedAt: null,
})
