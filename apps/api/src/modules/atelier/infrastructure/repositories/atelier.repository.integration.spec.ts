import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seed } from '../../../../infrastructure/database/seed.ts'
import { makeTestDatabase, type TestDatabase } from '../../../../shared/testing/pglite.harness.ts'
import { AtelierStatus, DIRECTORY_PAGE_SIZE } from '../../domain/constants/atelier.constant.ts'
import { AtelierRepositoryDrizzlePg } from './atelier.repository.drizzle-pg.ts'

const PAGE = { limit: DIRECTORY_PAGE_SIZE, offset: 0 }

describe('AtelierRepositoryDrizzlePg', () => {
  let database: TestDatabase
  let repository: AtelierRepositoryDrizzlePg

  beforeAll(async () => {
    database = await makeTestDatabase()
    await seed(database.db)
    repository = new AtelierRepositoryDrizzlePg(database.db)
  })

  afterAll(async () => {
    await database.close()
  })

  it('shows only the published ateliers, with their machine count and kinds', async () => {
    const summaries = await repository.listPublished(PAGE)

    expect(summaries.map((summary) => summary.slug)).not.toContain('atelier-en-preparation')
    expect(summaries.map((summary) => summary.slug)).not.toContain('atelier-des-chartrons')

    const forge = summaries.find((summary) => summary.slug === 'la-forge-montreuil')
    expect(forge?.machineCount).toBe(4)
    expect([...(forge?.machineKinds ?? [])].toSorted()).toEqual([
      'CNC_MILL',
      'LASER_CUTTER',
      'PRINTER_3D',
      'WOOD_LATHE',
    ])
  })

  it('filters by city, whatever the case', async () => {
    const summaries = await repository.listPublished({ ...PAGE, city: 'lyon' })

    expect(summaries.map((summary) => summary.slug).toSorted()).toEqual(['atelier-des-canuts', 'fabrique-lyonnaise'])
  })

  it('filters by machine kind, ignoring the retired ones', async () => {
    const summaries = await repository.listPublished({ ...PAGE, machineKind: 'SEWING' })

    expect(summaries.map((summary) => summary.slug).toSorted()).toEqual(['atelier-des-canuts', 'fabrique-lyonnaise'])
  })

  it('sorts by distance and clips at the radius', async () => {
    const summaries = await repository.listPublished({ ...PAGE, lat: 48.8566, lng: 2.3522, radiusKm: 20 })

    expect(summaries.map((summary) => summary.slug)).toEqual(['copeaux-et-cie-bastille', 'la-forge-montreuil'])
    expect(summaries[0]?.distanceKm).toBeLessThan(summaries[1]?.distanceKm ?? 0)
  })

  it('leaves the distance null when no point is given', async () => {
    const summaries = await repository.listPublished(PAGE)

    expect(summaries.every((summary) => summary.distanceKm === null)).toBe(true)
  })

  it('pages the directory', async () => {
    const first = await repository.listPublished({ ...PAGE, limit: 2 })
    const second = await repository.listPublished({ ...PAGE, limit: 2, offset: 2 })

    expect(first).toHaveLength(2)
    expect(second.map((summary) => summary.slug)).not.toEqual(first.map((summary) => summary.slug))
  })

  it('reads a published atelier by slug, and hides a draft one', async () => {
    expect((await repository.findPublishedBySlug('la-forge-montreuil'))?.name).toBe('La Forge')
    expect(await repository.findPublishedBySlug('atelier-en-preparation')).toBeNull()
    expect((await repository.findAnyBySlug('atelier-en-preparation'))?.status).toBe(AtelierStatus.DRAFT)
  })

  it('reads the latitude back as a number', async () => {
    const atelier = await repository.findPublishedBySlug('la-forge-montreuil')

    expect(atelier?.latitude).toBeCloseTo(48.8638, 4)
    expect(typeof atelier?.longitude).toBe('number')
  })

  it('leaves the retired machines out of the public list', async () => {
    const machines = await repository.listPublicMachines('0a7e1f00-0000-4000-8000-000000000001')

    expect(machines).toHaveLength(4)
    expect(machines.every((machine) => machine.status !== 'RETIRED')).toBe(true)
  })

  it('publishes an atelier and answers with its live machine count', async () => {
    const updated = await repository.updateStatus(
      '0a7e1f00-0000-4000-8000-000000000003',
      AtelierStatus.PUBLISHED,
      new Date('2026-09-15T10:00:00Z')
    )

    expect(updated?.status).toBe(AtelierStatus.PUBLISHED)
    expect(updated?.machineCount).toBe(0)
  })

  it('answers null on an atelier that does not exist', async () => {
    expect(
      await repository.updateStatus(
        '00000000-0000-4000-8000-000000000000',
        AtelierStatus.CLOSED,
        new Date('2026-09-15T10:00:00Z')
      )
    ).toBeNull()
  })
})
