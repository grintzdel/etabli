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

const post = (path: string, body: unknown) =>
  handler(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  )

const me = (token?: string) =>
  handler(
    new Request('http://localhost/auth/me', {
      headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
    })
  )

const register = (overrides: Record<string, unknown> = {}) =>
  post('/auth/register', {
    email: `member-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
    ...overrides,
  })

describe('POST /auth/register', () => {
  it('creates the account and answers a session', async () => {
    const response = await register()
    expect(response.status).toBe(201)

    const body = (await response.json()) as Record<string, unknown>
    expect(typeof body['token']).toBe('string')
    expect(typeof body['expiresAt']).toBe('string')
    expect((body['user'] as Record<string, unknown>)['displayName']).toBe('Camille Roux')
    expect((body['user'] as Record<string, unknown>)['platformRole']).toBe('MEMBER')
  })

  it('answers 409 when the address already has an account', async () => {
    const email = `duplicate-${globalThis.crypto.randomUUID()}@etabli.test`
    expect((await register({ email })).status).toBe(201)
    expect((await register({ email })).status).toBe(409)
  })

  it('treats the address case-insensitively', async () => {
    const email = `Case-${globalThis.crypto.randomUUID()}@Etabli.test`
    expect((await register({ email })).status).toBe(201)
    expect((await register({ email: email.toUpperCase() })).status).toBe(409)
  })

  it('answers 400 on a password below the minimum', async () => {
    expect((await register({ password: 'court' })).status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('answers a session on valid credentials', async () => {
    const email = `login-${globalThis.crypto.randomUUID()}@etabli.test`
    await register({ email })

    const response = await post('/auth/login', { email, password: 'un-mot-de-passe' })
    expect(response.status).toBe(200)
    expect(typeof ((await response.json()) as Record<string, unknown>)['token']).toBe('string')
  })

  it('answers the same error for a wrong password and an unknown address', async () => {
    const email = `oracle-${globalThis.crypto.randomUUID()}@etabli.test`
    await register({ email })

    const wrongPassword = await post('/auth/login', { email, password: 'pas-le-bon-mot-de-passe' })
    const unknownAddress = await post('/auth/login', {
      email: `absent-${globalThis.crypto.randomUUID()}@etabli.test`,
      password: 'un-mot-de-passe',
    })

    expect(wrongPassword.status).toBe(401)
    expect(unknownAddress.status).toBe(401)
    expect(await wrongPassword.json()).toEqual(await unknownAddress.json())
  })
})

describe('GET /auth/me', () => {
  it('answers 401 without an Authorization header', async () => {
    expect((await me()).status).toBe(401)
  })

  it('answers 401 on a malformed token', async () => {
    expect((await me('pas-un-jeton')).status).toBe(401)
  })

  it('answers the account behind a valid token', async () => {
    const email = `me-${globalThis.crypto.randomUUID()}@etabli.test`
    const session = (await (await register({ email })).json()) as { readonly token: string }

    const response = await me(session.token)
    expect(response.status).toBe(200)

    const body = (await response.json()) as Record<string, unknown>
    expect(body['email']).toBe(email.toLowerCase())
    expect(body['displayName']).toBe('Camille Roux')
  })
})
