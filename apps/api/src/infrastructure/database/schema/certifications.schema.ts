import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { machines } from './machines.schema.ts'
import { users } from './users.schema.ts'

export const certifications = pgTable(
  'certifications',
  {
    id: uuid().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    machineId: uuid()
      .notNull()
      .references(() => machines.id, { onDelete: 'cascade' }),
    status: text().notNull().default('PENDING'),
    requestedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp({ withTimezone: true }),
    decidedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    unique('certifications_user_id_machine_id_unique').on(table.userId, table.machineId),
    index('certifications_machine_idx').on(table.machineId),
    index('certifications_status_idx').on(table.status),
  ]
)
