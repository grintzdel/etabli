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

const JOINED = '77777777-7777-4777-8777-777777777771'
const STRANGER = '77777777-7777-4777-8777-777777777772'

const seedAtelier = (id: string, slug: string) =>
  runtime.runPromise(
    sql`
      INSERT INTO ateliers (id, slug, name, description, city, latitude, longitude, status)
      VALUES (${id}, ${slug}, 'La Forge', 'Un atelier partagé', 'Montreuil', 48.8638, 2.4485, 'PUBLISHED')
    `
  )

await seedAtelier(JOINED, 'la-forge-preferences')
await seedAtelier(STRANGER, 'atelier-inconnu-preferences')

const send = (method: string, path: string, body: unknown, token?: string) =>
  handler(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    })
  )

const read = (token?: string) =>
  handler(
    new Request('http://localhost/me/preferences', {
      headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
    })
  )

const patch = (body: unknown, token: string) => send('PATCH', '/me/preferences', body, token)

const register = async (): Promise<string> => {
  const response = await send('POST', '/auth/register', {
    email: `member-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const body = (await response.json()) as { token: string }
  return body.token
}

const join = async (token: string, atelierId: string): Promise<string> => {
  await send('POST', '/onboarding/complete', { atelierId, practice: ['bois'] }, token)
  return token
}

const body = async (response: Response) => (await response.json()) as Record<string, unknown>

describe('GET /me/preferences', () => {
  it('answers the defaults for an account that never saved anything', async () => {
    const response = await read(await register())

    expect(response.status).toBe(200)
    expect(await body(response)).toMatchObject({ theme: 'system', defaultAtelierId: null, updatedAt: null })
  })

  it('answers 401 without a token', async () => {
    expect((await read()).status).toBe(401)
  })
})

describe('GET /me/ateliers', () => {
  const myAteliers = (token?: string) =>
    handler(
      new Request('http://localhost/me/ateliers', {
        headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
      })
    )

  it('answers nothing for an account that joined nothing', async () => {
    const response = await myAteliers(await register())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('names and links the ateliers the member joined, and only those', async () => {
    const token = await join(await register(), JOINED)

    const joined = (await (await myAteliers(token)).json()) as ReadonlyArray<Record<string, unknown>>

    expect(joined).toEqual([{ id: JOINED, slug: 'la-forge-preferences', name: 'La Forge', role: 'MEMBER' }])
  })

  it('answers 401 without a token', async () => {
    expect((await myAteliers()).status).toBe(401)
  })
})

describe('PATCH /me/preferences', () => {
  it('stores the theme and reads it back on the next request', async () => {
    const token = await register()

    expect((await patch({ theme: 'light' }, token)).status).toBe(200)

    expect(await body(await read(token))).toMatchObject({ theme: 'light' })
  })

  it('leaves the default atelier alone when the patch only names the theme', async () => {
    const token = await join(await register(), JOINED)
    await patch({ defaultAtelierId: JOINED }, token)

    await patch({ theme: 'dark' }, token)

    expect(await body(await read(token))).toMatchObject({ theme: 'dark', defaultAtelierId: JOINED })
  })

  it('leaves the theme alone when the patch only names the default atelier', async () => {
    const token = await join(await register(), JOINED)
    await patch({ theme: 'light' }, token)

    await patch({ defaultAtelierId: JOINED }, token)

    expect(await body(await read(token))).toMatchObject({ theme: 'light', defaultAtelierId: JOINED })
  })

  it('clears the default atelier on an explicit null', async () => {
    const token = await join(await register(), JOINED)
    await patch({ defaultAtelierId: JOINED }, token)

    await patch({ defaultAtelierId: null }, token)

    expect(await body(await read(token))).toMatchObject({ defaultAtelierId: null })
  })

  it('answers 409 on an atelier the member never joined', async () => {
    const token = await join(await register(), JOINED)

    const response = await patch({ defaultAtelierId: STRANGER }, token)

    expect(response.status).toBe(409)
    expect(await body(response)).toMatchObject({ _tag: 'PreferredAtelierNotJoinedError' })
  })

  it('answers 400 on a theme nobody defined', async () => {
    expect((await patch({ theme: 'sepia' }, await register())).status).toBe(400)
  })

  it('answers 401 without a token', async () => {
    expect((await send('PATCH', '/me/preferences', { theme: 'dark' })).status).toBe(401)
  })
})
