import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import { afterAll, describe, expect, it } from 'vitest'

import { ApiLive } from '../layers/api-live'

const runtime = ManagedRuntime.make(PgLiteSqlClientLayer({ withAllMigrations: true }))
const sql = await runtime.runPromise(SqlClient.SqlClient)

const { dispose, handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(Layer.provide(Layer.succeed(SqlClient.SqlClient, sql)))
)

afterAll(async () => {
  await dispose()
  await runtime.dispose()
})

const FORGE = '11111111-1111-4111-8111-111111111111'
const LYON = '22222222-2222-4222-8222-222222222222'
const DRAFT = '33333333-3333-4333-8333-333333333333'

const seedAtelier = (
  id: string,
  slug: string,
  name: string,
  city: string,
  latitude: number,
  longitude: number,
  status: string
) =>
  runtime.runPromise(
    sql`
      INSERT INTO ateliers (id, slug, name, description, street, postal_code, city, country, latitude, longitude, status)
      VALUES (${id}, ${slug}, ${name}, 'Un atelier partagé', '12 rue des Forges', '93100', ${city}, 'FR', ${latitude}, ${longitude}, ${status})
    `
  )

const seedMachine = (atelierId: string, name: string, kind: string, status: string) =>
  runtime.runPromise(
    sql`
      INSERT INTO machines (id, atelier_id, name, description, kind, requires_certification, slot_duration_minutes, status)
      VALUES (${globalThis.crypto.randomUUID()}, ${atelierId}, ${name}, 'Une machine du parc', ${kind}, true, 60, ${status})
    `
  )

await seedAtelier(FORGE, 'la-forge', 'La Forge', 'Montreuil', 48.8638, 2.4485, 'PUBLISHED')
await seedAtelier(LYON, 'fabrique-lyonnaise', 'Fabrique Lyonnaise', 'Lyon', 45.764, 4.8357, 'PUBLISHED')
await seedAtelier(DRAFT, 'brouillon', 'Brouillon', 'Montreuil', 48.86, 2.44, 'DRAFT')

await seedMachine(FORGE, 'Trotec Speedy', 'LASER_CUTTER', 'AVAILABLE')
await seedMachine(FORGE, 'Prusa MK4', 'PRINTER_3D', 'MAINTENANCE')
await seedMachine(FORGE, 'Fraiseuse hors service', 'CNC_MILL', 'RETIRED')
await seedMachine(LYON, 'Juki', 'SEWING', 'AVAILABLE')

const get = (path: string) => handler(new Request(`http://localhost${path}`))

const body = async (path: string) => {
  const response = await get(path)
  expect(response.status).toBe(200)
  return (await response.json()) as ReadonlyArray<Record<string, unknown>>
}

describe('GET /ateliers', () => {
  it('answers only the published ateliers, ordered by name', async () => {
    expect((await body('/ateliers')).map((summary) => summary['slug'])).toEqual(['fabrique-lyonnaise', 'la-forge'])
  })

  it('counts the live parc and lists its kinds', async () => {
    const forge = (await body('/ateliers')).find((summary) => summary['slug'] === 'la-forge')
    expect(forge?.['machineCount']).toBe(2)
    expect(forge?.['machineKinds']).toEqual(['LASER_CUTTER', 'PRINTER_3D'])
  })

  it('filters on the city without minding the case', async () => {
    expect((await body('/ateliers?city=MONTREUIL')).map((summary) => summary['slug'])).toEqual(['la-forge'])
  })

  it('keeps only the ateliers holding a live machine of the requested kind', async () => {
    expect((await body('/ateliers?machineKind=SEWING')).map((summary) => summary['slug'])).toEqual([
      'fabrique-lyonnaise',
    ])
    expect(await body('/ateliers?machineKind=CNC_MILL')).toEqual([])
  })

  it('measures the distance and drops what falls outside the radius', async () => {
    const results = await body('/ateliers?lat=48.8566&lng=2.3522&radiusKm=20')
    expect(results.map((summary) => summary['slug'])).toEqual(['la-forge'])
    expect(results[0]?.['distanceKm']).toBeCloseTo(7, 0)
  })

  it('leaves the distance null when no position is given', async () => {
    expect((await body('/ateliers'))[0]?.['distanceKm']).toBeNull()
  })

  it('answers 400 when the position is given without its radius', async () => {
    expect((await get('/ateliers?lat=48.8566&lng=2.3522')).status).toBe(400)
  })

  it('paginates with limit and offset', async () => {
    expect((await body('/ateliers?limit=1')).map((summary) => summary['slug'])).toEqual(['fabrique-lyonnaise'])
    expect((await body('/ateliers?limit=1&offset=1')).map((summary) => summary['slug'])).toEqual(['la-forge'])
  })

  it('answers 400 on a limit outside its bounds', async () => {
    expect((await get('/ateliers?limit=0')).status).toBe(400)
    expect((await get('/ateliers?limit=500')).status).toBe(400)
  })
})

describe('GET /ateliers/:slug', () => {
  it('answers the sheet and its parc, retired machines left out', async () => {
    const response = await get('/ateliers/la-forge')
    expect(response.status).toBe(200)

    const sheet = (await response.json()) as Record<string, unknown>
    expect(sheet['city']).toBe('Montreuil')
    expect(sheet['street']).toBe('12 rue des Forges')

    const machines = sheet['machines'] as ReadonlyArray<Record<string, unknown>>
    expect(machines.map((machine) => machine['name'])).toEqual(['Prusa MK4', 'Trotec Speedy'])
    expect(machines.find((machine) => machine['name'] === 'Prusa MK4')?.['status']).toBe('MAINTENANCE')
  })

  it('answers 404 on an unknown slug', async () => {
    expect((await get('/ateliers/inconnu')).status).toBe(404)
  })

  it('answers 404 on a draft atelier', async () => {
    expect((await get('/ateliers/brouillon')).status).toBe(404)
  })
})
