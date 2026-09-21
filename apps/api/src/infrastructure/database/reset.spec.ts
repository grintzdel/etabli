import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeTestDatabase, type TestDatabase } from '../../shared/testing/pglite.harness.ts'
import { assertResettable, resetDatabase, resettableTables } from './reset.ts'
import { ateliers, bookings, certifications, machines, memberships, userPreferences, users } from './schema/index.ts'
import { seed, seedDemo } from './seed.ts'

describe('resettableTables', () => {
  it('covers every table the schema declares', () => {
    expect(resettableTables()).toEqual([
      'ateliers',
      'bookings',
      'certifications',
      'machines',
      'memberships',
      'user_preferences',
      'users',
    ])
  })
})

describe('assertResettable', () => {
  it('accepts the local test database', () => {
    expect(() => {
      assertResettable('postgresql://etabli:etabli@localhost:5433/etabli_test')
    }).not.toThrow()
  })

  it('accepts a loopback address', () => {
    expect(() => {
      assertResettable('postgresql://etabli:etabli@127.0.0.1:5433/etabli_test')
    }).not.toThrow()
  })

  it('refuses a remote database', () => {
    expect(() => {
      assertResettable('postgresql://user:pw@ep-cool-name.eu-central-1.aws.neon.tech/etabli?sslmode=require')
    }).toThrow(/ep-cool-name/)
  })
})

describe('resetDatabase', () => {
  let database: TestDatabase

  beforeAll(async () => {
    database = await makeTestDatabase()
    await seed(database.db)
    await seedDemo(database.db)
  })

  afterAll(async () => {
    await database.close()
  })

  it('empties every table, then lets the seed run again', async () => {
    expect(await database.db.select().from(ateliers)).not.toHaveLength(0)
    expect(await database.db.select().from(bookings)).not.toHaveLength(0)

    await resetDatabase(database.db)

    const remaining = await Promise.all(
      [ateliers, bookings, certifications, machines, memberships, userPreferences, users].map(async (table) =>
        database.db.select().from(table)
      )
    )
    expect(remaining.map((rows) => rows.length)).toEqual([0, 0, 0, 0, 0, 0, 0])

    await seed(database.db)
    await seedDemo(database.db)

    expect(await database.db.select().from(ateliers)).not.toHaveLength(0)
    expect(await database.db.select().from(bookings)).not.toHaveLength(0)
  })
})
