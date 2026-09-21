import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { ateliers } from './ateliers.schema.ts'
import { machines } from './machines.schema.ts'
import { users } from './users.schema.ts'

export const bookings = pgTable(
  'bookings',
  {
    id: uuid().primaryKey(),
    machineId: uuid()
      .notNull()
      .references(() => machines.id, { onDelete: 'cascade' }),
    atelierId: uuid()
      .notNull()
      .references(() => ateliers.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startAt: timestamp({ withTimezone: true }).notNull(),
    endAt: timestamp({ withTimezone: true }).notNull(),
    status: text().notNull().default('CONFIRMED'),
    checkedInAt: timestamp({ withTimezone: true }),
    checkedInVia: text(),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelledBy: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('bookings_ends_after_it_starts', sql`${table.endAt} > ${table.startAt}`),
    index('bookings_user_idx').on(table.userId, table.startAt.desc()),
    index('bookings_machine_idx').on(table.machineId, table.startAt),
  ]
)
