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
    expect(updated?.checkInToken).toBe(before?.checkInToken)
  })

  it('rotates the check-in token, and the unique index still holds', async () => {
    const rotated = await repository.update(
      SEED.machine.forgePrusa,
      { checkInToken: 'qr-forge-prusa-02' },
      new Date('2026-09-15T10:00:00Z')
    )

    expect(rotated?.checkInToken).toBe('qr-forge-prusa-02')
    await expect(
      repository.update(SEED.machine.forgeLaser, { checkInToken: 'qr-forge-prusa-02' }, new Date())
    ).rejects.toThrow()
  })

  it('reads the public fiche of a machine in service, atelier carried along', async () => {
    const machine = await repository.findPublicById(SEED.machine.forgeLaser)

    expect(machine?.name).toBe('Trotec Speedy 400')
    expect(machine?.atelierSlug).toBe('la-forge-montreuil')
  })

  it('withholds a retired machine from the public fiche', async () => {
    expect(await repository.findPublicById(SEED.machine.forgeRetired)).toBeNull()
  })

  it('withholds a machine whose atelier is not published', async () => {
    const hidden = await repository.insert({
      id: '0a7e1f00-0000-4000-8000-0000000009ff',
      atelierId: SEED.atelier.draft,
      name: 'Presse en caisse',
      description: '',
      kind: 'CNC_MILL',
      requiresCertification: true,
      slotDurationMinutes: 60,
      status: 'AVAILABLE',
      checkInToken: 'qr-presse-en-caisse-01',
      createdAt: new Date('2026-09-15T10:00:00Z'),
    })

    expect(await repository.findById(hidden.id)).not.toBeNull()
    expect(await repository.findPublicById(hidden.id)).toBeNull()
  })
})
