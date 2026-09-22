import { index, integer, boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { ateliers } from './ateliers.schema.ts'

export const machines = pgTable(
  'machines',
  {
    id: uuid().primaryKey(),
    atelierId: uuid()
      .notNull()
      .references(() => ateliers.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    description: text().notNull().default(''),
    kind: text().notNull(),
    requiresCertification: boolean().notNull().default(true),
    slotDurationMinutes: integer().notNull().default(60),
    status: text().notNull().default('AVAILABLE'),
    checkInToken: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('machines_atelier_idx').on(table.atelierId), index('machines_kind_idx').on(table.kind)]
)
