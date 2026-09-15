import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid().primaryKey(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  displayName: text().notNull(),
  platformRole: text().notNull().default('MEMBER'),
  practice: text().array().notNull().default([]),
  onboardingCompletedAt: timestamp({ withTimezone: true }),
  status: text().notNull().default('ACTIVE'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
