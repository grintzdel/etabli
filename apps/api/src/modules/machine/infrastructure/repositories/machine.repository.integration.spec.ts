import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seed } from '../../../../infrastructure/database/seed.ts'
import { makeTestDatabase, type TestDatabase } from '../../../../shared/testing/pglite.harness.ts'
import { SEED } from '../../../../shared/testing/seeded-app.harness.ts'
import { MachineRepositoryDrizzlePg } from './machine.repository.drizzle-pg.ts'

describe('MachineRepositoryDrizzlePg', () => {
  let database: TestDatabase
  let repository: MachineRepositoryDrizzlePg

  beforeAll(async () => {
    database = await makeTestDatabase()
    await seed(database.db)
    repository = new MachineRepositoryDrizzlePg(database.db)
  })

  afterAll(async () => {
    await database.close()
  })

  it('carries the atelier name and slug alongside the machine', async () => {
    const machine = await repository.findById(SEED.machine.forgeLaser)

    expect(machine?.name).toBe('Trotec Speedy 400')
    expect(machine?.atelierName).toBe('La Forge')
    expect(machine?.atelierSlug).toBe('la-forge-montreuil')
  })

  it('answers null on a machine that does not exist', async () => {
    expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull()
  })

  it('reads a machine by its NFC tag', async () => {
    expect((await repository.findByNfcTag('nfc-forge-laser-01'))?.id).toBe(SEED.machine.forgeLaser)
    expect(await repository.findByNfcTag('nfc-inconnu')).toBeNull()
  })

  it('keeps the retired machines in the atelier parc', async () => {
    const machines = await repository.listForAtelier(SEED.atelier.forge)

    expect(machines).toHaveLength(5)
    expect(machines.some((machine) => machine.status === 'RETIRED')).toBe(true)
  })

  it('lists the machines of several ateliers at once, without duplicates', async () => {
    const machines = await repository.listForAteliers([SEED.atelier.forge, SEED.atelier.forge, SEED.atelier.lyon])

    expect(machines).toHaveLength(8)
    expect(new Set(machines.map((machine) => machine.id)).size).toBe(8)
  })

  it('answers an empty list when no atelier is given', async () => {
    expect(await repository.listForAteliers([])).toEqual([])
    expect(await repository.findMany([])).toEqual([])
  })

  it('patches only the keys that are given', async () => {
    const before = await repository.findById(SEED.machine.forgePrusa)
    const updated = await repository.update(
      SEED.machine.forgePrusa,
      { status: 'AVAILABLE' },
      new Date('2026-09-15T10:00:00Z')
    )

    expect(updated?.status).toBe('AVAILABLE')
    expect(updated?.name).toBe(before?.name)
    expect(updated?.nfcTagId).toBe(before?.nfcTagId)
  })

  it('unsticks the tag on an explicit null', async () => {
    const updated = await repository.update(
      SEED.machine.forgePrusa,
      { nfcTagId: null },
      new Date('2026-09-15T10:00:00Z')
    )

    expect(updated?.nfcTagId).toBeNull()
  })
})
