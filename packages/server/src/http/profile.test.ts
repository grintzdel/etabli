import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Layer from 'effect/Layer'
import { afterAll, describe, expect, it } from 'vitest'

import { ApiLive } from '../layers/api-live'

const { dispose, handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(
    Layer.provide(PgLiteSqlClientLayer({ withAllMigrations: true }))
  )
)

afterAll(() => dispose())

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

const me = (token: string) =>
  handler(new Request('http://localhost/auth/me', { headers: { authorization: `Bearer ${token}` } }))

const register = async (): Promise<string> => {
  const response = await send('POST', '/auth/register', {
    email: `member-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const session = (await response.json()) as { token: string }
  return session.token
}

const patch = (body: unknown, token?: string) => send('PATCH', '/me/profile', body, token)

const read = async (response: Response) => (await response.json()) as Record<string, unknown>

describe('PATCH /me/profile', () => {
  it('renames the member and answers the fresh session view', async () => {
    const token = await register()

    const response = await patch({ displayName: 'Camille R.' }, token)

    expect(response.status).toBe(200)
    expect(await read(response)).toMatchObject({ displayName: 'Camille R.' })
    expect(await read(await me(token))).toMatchObject({ displayName: 'Camille R.' })
  })

  it('declares the practice on an account that never onboarded', async () => {
    const token = await register()

    await patch({ practice: ['Bois', 'Textile'] }, token)

    expect(await read(await me(token))).toMatchObject({ practice: ['Bois', 'Textile'] })
  })

  it('leaves the display name alone when the patch only names the practice', async () => {
    const token = await register()

    await patch({ practice: ['Métal'] }, token)

    expect(await read(await me(token))).toMatchObject({ displayName: 'Camille Roux', practice: ['Métal'] })
  })

  it('leaves the practice alone when the patch only names the display name', async () => {
    const token = await register()
    await patch({ practice: ['Métal'] }, token)

    await patch({ displayName: 'Camille R.' }, token)

    expect(await read(await me(token))).toMatchObject({ displayName: 'Camille R.', practice: ['Métal'] })
  })

  it('trims the display name and refuses one made of blanks', async () => {
    const token = await register()

    await patch({ displayName: '  Camille R.  ' }, token)
    expect(await read(await me(token))).toMatchObject({ displayName: 'Camille R.' })

    expect((await patch({ displayName: '   ' }, token)).status).toBe(400)
  })

  it('refuses an empty practice, as the onboarding does', async () => {
    expect((await patch({ practice: [] }, await register())).status).toBe(400)
  })

  it('answers 401 without a token', async () => {
    expect((await patch({ displayName: 'Anonyme' })).status).toBe(401)
  })
})
