import { sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { ateliers } from './ateliers.schema.ts'
import { users } from './users.schema.ts'

export const userPreferences = pgTable(
  'user_preferences',
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    theme: text().notNull().default('system'),
    defaultAtelierId: uuid().references(() => ateliers.id, { onDelete: 'set null' }),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('user_preferences_theme_is_known', sql`${table.theme} IN ('dark', 'light', 'system')`)]
)
