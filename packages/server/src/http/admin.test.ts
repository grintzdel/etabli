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

const UNKNOWN = '66666666-6666-4666-8666-666666666666'

const send = (method: string, path: string, body?: unknown, token?: string) =>
  handler(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  )

const register = async (): Promise<{ readonly token: string; readonly userId: string }> => {
  const response = await send('POST', '/auth/register', {
    email: `admin-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const body = (await response.json()) as { token: string; user: { id: string } }
  return { token: body.token, userId: body.user.id }
}

const promote = async (): Promise<string> => {
  const { token, userId } = await register()
  await runtime.runPromise(sql`UPDATE users SET platform_role = 'PLATFORM_ADMIN' WHERE id = ${userId}`)
  return token
}

const draft = (slug: string) => ({
  slug,
  name: 'La Forge',
  description: 'Un atelier partagé',
  city: 'Montreuil',
  latitude: 48.8638,
  longitude: 2.4485,
})

describe('POST /admin/ateliers', () => {
  it('opens an atelier as a draft, absent from the public directory', async () => {
    const token = await promote()
    const response = await send('POST', '/admin/ateliers', draft('la-forge'), token)

    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>
    expect(body['status']).toBe('DRAFT')
    expect(body['machineCount']).toBe(0)

    const directory = (await (await send('GET', '/ateliers')).json()) as ReadonlyArray<{ slug: string }>
    expect(directory.some((atelier) => atelier.slug === 'la-forge')).toBe(false)
  })

  it('answers 403 to a plain member', async () => {
    const { token } = await register()
    expect((await send('POST', '/admin/ateliers', draft('refuse'), token)).status).toBe(403)
  })

  it('answers 401 without a token', async () => {
    expect((await send('POST', '/admin/ateliers', draft('anonyme'))).status).toBe(401)
  })

  it('answers 409 on a slug already taken', async () => {
    const token = await promote()
    await send('POST', '/admin/ateliers', draft('doublon'), token)
    expect((await send('POST', '/admin/ateliers', draft('doublon'), token)).status).toBe(409)
  })

  it('answers 400 on a slug that is not url-shaped', async () => {
    const token = await promote()
    expect((await send('POST', '/admin/ateliers', draft('La Forge !'), token)).status).toBe(400)
  })
})

describe('PATCH /admin/ateliers/:id', () => {
  it('publishes the atelier, which is what puts it in the directory', async () => {
    const token = await promote()
    const created = (await (await send('POST', '/admin/ateliers', draft('a-publier'), token)).json()) as { id: string }

    const response = await send('PATCH', `/admin/ateliers/${created.id}`, { status: 'PUBLISHED' }, token)
    expect(response.status).toBe(200)

    const directory = (await (await send('GET', '/ateliers')).json()) as ReadonlyArray<{ slug: string }>
    expect(directory.some((atelier) => atelier.slug === 'a-publier')).toBe(true)
  })

  it('answers 404 on an atelier that does not exist', async () => {
    const token = await promote()
    expect((await send('PATCH', `/admin/ateliers/${UNKNOWN}`, { status: 'PUBLISHED' }, token)).status).toBe(404)
  })

  it('answers 403 to a plain member', async () => {
    const admin = await promote()
    const created = (await (await send('POST', '/admin/ateliers', draft('protege'), admin)).json()) as { id: string }
    const { token } = await register()

    expect((await send('PATCH', `/admin/ateliers/${created.id}`, { status: 'PUBLISHED' }, token)).status).toBe(403)
  })
})

describe('GET /admin/ateliers', () => {
  it('answers the drafts the public directory hides', async () => {
    const token = await promote()
    await send('POST', '/admin/ateliers', draft('inventaire'), token)

    const response = await send('GET', '/admin/ateliers', undefined, token)
    expect(response.status).toBe(200)
    const body = (await response.json()) as ReadonlyArray<{ slug: string; status: string }>
    expect(body.find((atelier) => atelier.slug === 'inventaire')?.status).toBe('DRAFT')
  })

  it('answers 403 to a plain member', async () => {
    const { token } = await register()
    expect((await send('GET', '/admin/ateliers', undefined, token)).status).toBe(403)
  })
})
