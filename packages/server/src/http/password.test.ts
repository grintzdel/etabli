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

const PASSWORD = 'un-mot-de-passe'

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

const register = async (): Promise<{ readonly email: string; readonly token: string }> => {
  const email = `member-${globalThis.crypto.randomUUID()}@etabli.test`
  const response = await post('/auth/register', { email, password: PASSWORD, displayName: 'Camille Roux' })
  const session = (await response.json()) as { token: string }
  return { email, token: session.token }
}

const change = (body: unknown, token?: string) => post('/auth/password', body, token)

const login = (email: string, password: string) => post('/auth/login', { email, password })

const me = (token: string) =>
  handler(new Request('http://localhost/auth/me', { headers: { authorization: `Bearer ${token}` } }))

describe('POST /auth/password', () => {
  it('changes the password and answers a fresh session', async () => {
    const { email, token } = await register()

    const response = await change({ currentPassword: PASSWORD, newPassword: 'un-autre-mot-de-passe' }, token)

    expect(response.status).toBe(200)
    const session = (await response.json()) as Record<string, unknown>
    expect(typeof session['token']).toBe('string')
    expect((session['user'] as Record<string, unknown>)['email']).toBe(email)

    expect((await me(session['token'] as string)).status).toBe(200)
  })

  it('lets the member sign in with the new password and refuses the old one', async () => {
    const { email, token } = await register()
    await change({ currentPassword: PASSWORD, newPassword: 'un-autre-mot-de-passe' }, token)

    expect((await login(email, 'un-autre-mot-de-passe')).status).toBe(200)
    expect((await login(email, PASSWORD)).status).toBe(401)
  })

  it('refuses a wrong current password without touching the stored one', async () => {
    const { email, token } = await register()

    const response = await change({ currentPassword: 'pas-le-bon', newPassword: 'un-autre-mot-de-passe' }, token)

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ _tag: 'InvalidCredentialsError' })
    expect((await login(email, PASSWORD)).status).toBe(200)
  })

  it('refuses a new password shorter than the minimum', async () => {
    const { token } = await register()

    expect((await change({ currentPassword: PASSWORD, newPassword: 'court' }, token)).status).toBe(400)
  })

  it('answers 401 without a token', async () => {
    expect((await change({ currentPassword: PASSWORD, newPassword: 'un-autre-mot-de-passe' })).status).toBe(401)
  })

  it('leaves the tokens issued before the change valid, for want of a revocation list', async () => {
    const { token } = await register()

    await change({ currentPassword: PASSWORD, newPassword: 'un-autre-mot-de-passe' }, token)

    expect((await me(token)).status).toBe(200)
  })
})
