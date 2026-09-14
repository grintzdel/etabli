import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { at, bookingFixture, FORGE } from '../__tests__/booking.test-layer'
import { BookingStatus } from '../domain/booking.constants'
import type { Booking } from '../domain/booking.schema'
import type { BookingRepositoryService } from './booking.repository'
import { makeBookingRepositoryMemory } from './booking.repository.memory'
import { makeBookingRepositorySql } from './booking.repository.sql'

const runtime = ManagedRuntime.make(PgLiteSqlClientLayer({ withAllMigrations: true }))
const sql = await runtime.runPromise(SqlClient.SqlClient)
const repository = makeBookingRepositorySql(sql)

const MEMBER = '00000000-0000-4000-8000-000000000001'
const MACHINE = '20000000-0000-4000-8000-000000000001'
const OTHER_MACHINE = '20000000-0000-4000-8000-000000000002'

await runtime.runPromise(
  Effect.gen(function* () {
    yield* sql`
      INSERT INTO users (id, email, password_hash, display_name)
      VALUES (${MEMBER}, 'camille@etabli.test', 'hash', 'Camille Roux')
    `
    yield* sql`
      INSERT INTO ateliers (id, slug, name, city, latitude, longitude, status)
      VALUES (${FORGE}, 'la-forge', 'La Forge', 'Montreuil', 48.8638, 2.4485, 'PUBLISHED')
    `
    yield* sql`
      INSERT INTO machines (id, atelier_id, name, kind)
      VALUES (${MACHINE}, ${FORGE}, 'Trotec', 'LASER_CUTTER'), (${OTHER_MACHINE}, ${FORGE}, 'Prusa', 'PRINTER_3D')
    `
  })
)

afterAll(() => runtime.dispose())

const booking = (overrides: Partial<Booking> = {}): Booking =>
  bookingFixture({ machineId: MACHINE as Booking['machineId'], userId: MEMBER as Booking['userId'], ...overrides })

const insert = (value: Booking) => runtime.runPromiseExit(repository.insert(value))

beforeEach(() => runtime.runPromise(sql`DELETE FROM bookings`))

describe('BookingRepository on Postgres', () => {
  it('reads back what it wrote', async () => {
    const written = booking()

    await insert(written)
    const found = await runtime.runPromise(repository.findById(written.id))

    expect(found?.id).toBe(written.id)
    expect(found?.startAt).toStrictEqual(written.startAt)
    expect(found?.status).toBe(BookingStatus.CONFIRMED)
  })

  it('refuses a booking overlapping a confirmed one on the same machine', async () => {
    await insert(booking())

    const exit = await insert(booking({ startAt: at('2026-03-02T09:30:00Z'), endAt: at('2026-03-02T10:30:00Z') }))

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isSuccess(exit)) return
    expect(JSON.stringify(exit.cause)).toContain('BookingOverlapError')
  })

  it('accepts a booking that starts when the previous one ends', async () => {
    await insert(booking())

    const exit = await insert(booking({ startAt: at('2026-03-02T10:00:00Z'), endAt: at('2026-03-02T11:00:00Z') }))

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it('accepts the same slot on another machine', async () => {
    await insert(booking())

    const exit = await insert(booking({ machineId: OTHER_MACHINE as Booking['machineId'] }))

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it('frees the slot a cancelled booking held', async () => {
    await insert(booking({ status: BookingStatus.CANCELLED, cancelledAt: at('2026-03-01T08:00:00Z') }))

    const exit = await insert(booking())

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it('lists only the active bookings overlapping the window', async () => {
    await insert(booking())
    await insert(booking({ startAt: at('2026-03-05T09:00:00Z'), endAt: at('2026-03-05T10:00:00Z') }))
    await insert(
      booking({
        status: BookingStatus.CANCELLED,
        startAt: at('2026-03-03T09:00:00Z'),
        endAt: at('2026-03-03T10:00:00Z'),
      })
    )

    const found = await runtime.runPromise(
      repository.listActiveForMachineBetween(
        MACHINE as Booking['machineId'],
        at('2026-03-02T00:00:00Z'),
        at('2026-03-04T00:00:00Z')
      )
    )

    expect(found.map((item) => item.startAt)).toStrictEqual([at('2026-03-02T09:00:00Z')])
  })

  it('lists what a member booked, most recent first', async () => {
    await insert(booking())
    await insert(booking({ startAt: at('2026-03-05T09:00:00Z'), endAt: at('2026-03-05T10:00:00Z') }))

    const found = await runtime.runPromise(repository.listForUser(MEMBER as Booking['userId']))

    expect(found.map((item) => item.startAt)).toStrictEqual([at('2026-03-05T09:00:00Z'), at('2026-03-02T09:00:00Z')])
  })
})

describe('BookingRepository in memory', () => {
  const sameRules = (make: () => BookingRepositoryService) => {
    it('refuses an overlapping booking like Postgres does', async () => {
      const memory = make()
      await Effect.runPromise(memory.insert(booking()))

      const exit = await Effect.runPromiseExit(
        memory.insert(booking({ startAt: at('2026-03-02T09:30:00Z'), endAt: at('2026-03-02T10:30:00Z') }))
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('accepts a booking that starts when the previous one ends', async () => {
      const memory = make()
      await Effect.runPromise(memory.insert(booking()))

      const exit = await Effect.runPromiseExit(
        memory.insert(booking({ startAt: at('2026-03-02T10:00:00Z'), endAt: at('2026-03-02T11:00:00Z') }))
      )

      expect(Exit.isSuccess(exit)).toBe(true)
    })
  }

  sameRules(makeBookingRepositoryMemory)
})
