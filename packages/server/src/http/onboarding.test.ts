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

const PUBLISHED = '44444444-4444-4444-8444-444444444444'
const DRAFT = '55555555-5555-4555-8555-555555555555'
const UNKNOWN = '66666666-6666-4666-8666-666666666666'

const seedAtelier = (id: string, slug: string, status: string) =>
  runtime.runPromise(
    sql`
      INSERT INTO ateliers (id, slug, name, description, city, latitude, longitude, status)
      VALUES (${id}, ${slug}, 'La Forge', 'Un atelier partagé', 'Montreuil', 48.8638, 2.4485, ${status})
    `
  )

await seedAtelier(PUBLISHED, 'la-forge', 'PUBLISHED')
await seedAtelier(DRAFT, 'brouillon', 'DRAFT')

const post = (path: string, body: unknown, token?: string) =>
  handler(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    })
  )

const me = (token: string) =>
  handler(new Request('http://localhost/auth/me', { headers: { authorization: `Bearer ${token}` } }))

const register = async (): Promise<string> => {
  const response = await post('/auth/register', {
    email: `member-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const body = (await response.json()) as { token: string }
  return body.token
}

const complete = (token: string, body: unknown) => post('/onboarding/complete', body, token)

describe('POST /onboarding/complete', () => {
  it('joins the atelier and answers the membership', async () => {
    const token = await register()
    const response = await complete(token, { atelierId: PUBLISHED, practice: ['bois', 'métal'] })

    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>
    expect(body['atelierSlug']).toBe('la-forge')
    expect(body['role']).toBe('MEMBER')
    expect(body['practice']).toEqual(['bois', 'métal'])
  })

  it('shows up on the session, with the practice and the completion date', async () => {
    const token = await register()
    await complete(token, { atelierId: PUBLISHED, practice: ['couture'] })

    const body = (await (await me(token)).json()) as Record<string, unknown>
    expect(body['memberships']).toEqual([{ atelierId: PUBLISHED, role: 'MEMBER' }])
    expect(body['practice']).toEqual(['couture'])
    expect(typeof body['onboardingCompletedAt']).toBe('string')
  })

  it('leaves a fresh account without membership and without a completion date', async () => {
    const body = (await (await me(await register())).json()) as Record<string, unknown>
    expect(body['memberships']).toEqual([])
    expect(body['onboardingCompletedAt']).toBeNull()
  })

  it('is idempotent: onboarding twice keeps one membership', async () => {
    const token = await register()
    await complete(token, { atelierId: PUBLISHED, practice: ['bois'] })
    expect((await complete(token, { atelierId: PUBLISHED, practice: ['métal'] })).status).toBe(201)

    const body = (await (await me(token)).json()) as Record<string, unknown>
    expect(body['memberships']).toHaveLength(1)
    expect(body['practice']).toEqual(['métal'])
  })

  it('answers 401 without a token', async () => {
    expect((await post('/onboarding/complete', { atelierId: PUBLISHED, practice: ['bois'] })).status).toBe(401)
  })

  it('answers 404 on an atelier that does not exist', async () => {
    const token = await register()
    expect((await complete(token, { atelierId: UNKNOWN, practice: ['bois'] })).status).toBe(404)
  })

  it('answers 404 on a draft atelier, same as an unknown one', async () => {
    const token = await register()
    expect((await complete(token, { atelierId: DRAFT, practice: ['bois'] })).status).toBe(404)
  })

  it('answers 400 when no practice is declared', async () => {
    const token = await register()
    expect((await complete(token, { atelierId: PUBLISHED, practice: [] })).status).toBe(400)
  })

  it('answers 400 on an atelier id that is not a uuid', async () => {
    const token = await register()
    expect((await complete(token, { atelierId: 'la-forge', practice: ['bois'] })).status).toBe(400)
  })
})
