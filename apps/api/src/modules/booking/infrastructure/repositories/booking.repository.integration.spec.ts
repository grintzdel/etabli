import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Database } from '../../../../infrastructure/database/database.token.ts'
import { seed } from '../../../../infrastructure/database/seed.ts'
import { makeTestDatabase, type TestDatabase } from '../../../../shared/testing/pglite.harness.ts'
import { SEED } from '../../../../shared/testing/seeded-app.harness.ts'
import { BookingStatus, CheckInMethod } from '../../domain/constants/booking.constant.ts'
import type { BookingProps } from '../../domain/entities/booking.entity.ts'
import { BookingOverlapError } from '../../domain/errors/booking.errors.ts'
import { BookingRepositoryDrizzlePg } from './booking.repository.drizzle-pg.ts'

const at = (iso: string): Date => new Date(iso)

const props = (overrides: Partial<BookingProps> = {}): BookingProps => ({
  id: randomUUID(),
  machineId: SEED.machine.forgeLaser,
  atelierId: SEED.atelier.forge,
  userId: SEED.user.member,
  startAt: at('2026-09-16T10:00:00Z'),
  endAt: at('2026-09-16T11:00:00Z'),
  status: BookingStatus.CONFIRMED,
  checkedInAt: null,
  checkedInVia: null,
  cancelledAt: null,
  cancelledBy: null,
  createdAt: at('2026-09-15T10:00:00Z'),
  updatedAt: at('2026-09-15T10:00:00Z'),
  ...overrides,
})

describe('BookingRepositoryDrizzlePg', () => {
  let database: TestDatabase
  let db: Database
  let repository: BookingRepositoryDrizzlePg

  beforeAll(async () => {
    database = await makeTestDatabase()
    db = database.db
    await seed(db)
    repository = new BookingRepositoryDrizzlePg(db)
  })

  afterAll(async () => {
    await database.close()
  })

  it('reads back what it wrote', async () => {
    const inserted = await repository.insert(
      props({ startAt: at('2026-10-01T08:00:00Z'), endAt: at('2026-10-01T09:00:00Z') })
    )
    const found = await repository.findById(inserted.id)

    expect(found?.id).toBe(inserted.id)
    expect(found?.startAt).toStrictEqual(at('2026-10-01T08:00:00Z'))
  })

  it('turns the exclusion violation into a BookingOverlapError', async () => {
    await repository.insert(props({ startAt: at('2026-10-02T08:00:00Z'), endAt: at('2026-10-02T09:00:00Z') }))

    await expect(
      repository.insert(props({ startAt: at('2026-10-02T08:30:00Z'), endAt: at('2026-10-02T09:30:00Z') }))
    ).rejects.toThrow(BookingOverlapError)
  })

  it('lets a slot start exactly where the previous one ends', async () => {
    await repository.insert(props({ startAt: at('2026-10-03T08:00:00Z'), endAt: at('2026-10-03T09:00:00Z') }))

    await expect(
      repository.insert(props({ startAt: at('2026-10-03T09:00:00Z'), endAt: at('2026-10-03T10:00:00Z') }))
    ).resolves.toBeDefined()
  })

  it('frees the slot once the booking is cancelled', async () => {
    const first = await repository.insert(
      props({ startAt: at('2026-10-04T08:00:00Z'), endAt: at('2026-10-04T09:00:00Z') })
    )
    await repository.cancel(first.id, at('2026-10-03T08:00:00Z'), SEED.user.member)

    await expect(
      repository.insert(props({ startAt: at('2026-10-04T08:00:00Z'), endAt: at('2026-10-04T09:00:00Z') }))
    ).resolves.toBeDefined()
  })

  it('holds the slot while the booking is checked in', async () => {
    const first = await repository.insert(
      props({ startAt: at('2026-10-05T08:00:00Z'), endAt: at('2026-10-05T09:00:00Z') })
    )
    await repository.checkIn(first.id, at('2026-10-05T07:55:00Z'), CheckInMethod.MANUAL)

    await expect(
      repository.insert(props({ startAt: at('2026-10-05T08:30:00Z'), endAt: at('2026-10-05T09:30:00Z') }))
    ).rejects.toThrow(BookingOverlapError)
  })

  it('frees the slot once the booking is a no-show', async () => {
    const first = await repository.insert(
      props({ startAt: at('2026-10-06T08:00:00Z'), endAt: at('2026-10-06T09:00:00Z') })
    )
    await repository.markNoShow(first.id, at('2026-10-06T08:31:00Z'))

    await expect(
      repository.insert(props({ startAt: at('2026-10-06T08:00:00Z'), endAt: at('2026-10-06T09:00:00Z') }))
    ).resolves.toBeDefined()
  })

  it('refuses a slot that ends before it starts', async () => {
    await expect(
      repository.insert(props({ startAt: at('2026-10-07T09:00:00Z'), endAt: at('2026-10-07T08:00:00Z') }))
    ).rejects.toThrow()
  })

  it('lists only the active bookings that overlap the window', async () => {
    const machineId = SEED.machine.copeauxBambu
    await repository.insert(
      props({
        machineId,
        atelierId: SEED.atelier.copeaux,
        startAt: at('2026-11-02T08:00:00Z'),
        endAt: at('2026-11-02T09:00:00Z'),
      })
    )
    const cancelled = await repository.insert(
      props({
        machineId,
        atelierId: SEED.atelier.copeaux,
        startAt: at('2026-11-02T10:00:00Z'),
        endAt: at('2026-11-02T11:00:00Z'),
      })
    )
    await repository.cancel(cancelled.id, at('2026-11-01T08:00:00Z'), SEED.user.member)

    const active = await repository.listActiveForMachineBetween(
      machineId,
      at('2026-11-02T00:00:00Z'),
      at('2026-11-03T00:00:00Z')
    )

    expect(active).toHaveLength(1)
    expect(active[0]?.startAt).toStrictEqual(at('2026-11-02T08:00:00Z'))
  })

  it('answers an empty list when no atelier is given', async () => {
    expect(await repository.listForAteliersBetween([], at('2026-01-01T00:00:00Z'), at('2027-01-01T00:00:00Z'))).toEqual(
      []
    )
  })
})
