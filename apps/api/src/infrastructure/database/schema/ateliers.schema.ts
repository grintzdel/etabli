import { index, numeric, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { users } from './users.schema.ts'

export const ateliers = pgTable(
  'ateliers',
  {
    id: uuid().primaryKey(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull().default(''),
    street: text().notNull().default(''),
    postalCode: text().notNull().default(''),
    city: text().notNull(),
    country: text().notNull().default('FR'),
    latitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
    longitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
    status: text().notNull().default('DRAFT'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ateliers_status_idx').on(table.status),
    index('ateliers_coordinates_idx').on(table.latitude, table.longitude),
  ]
)

export const memberships = pgTable(
  'memberships',
  {
    id: uuid().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    atelierId: uuid()
      .notNull()
      .references(() => ateliers.id, { onDelete: 'cascade' }),
    role: text().notNull().default('MEMBER'),
    status: text().notNull().default('ACTIVE'),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('memberships_user_id_atelier_id_unique').on(table.userId, table.atelierId),
    index('memberships_atelier_idx').on(table.atelierId),
  ]
)
