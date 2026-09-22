import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApiClient, type ApiClientConfig, type FetchLike } from './api-client'
import { errorCodeOf } from './error-code'

const BASE = 'http://api.test'

const CODES = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
type Code = (typeof CODES)[keyof typeof CODES]

const MESSAGES: Readonly<Record<Code, string>> = {
  NOT_FOUND: 'Introuvable.',
  UNAUTHORIZED: 'Session expirée.',
  UNREACHABLE: 'Service indisponible.',
}

const failureOf = (status: number, body: unknown): Code => {
  if (errorCodeOf(body) === 'ATELIER_UNKNOWN') return CODES.NOT_FOUND
  if (status === 401) return CODES.UNAUTHORIZED
  if (status === 404) return CODES.NOT_FOUND
  return CODES.UNREACHABLE
}

const client = (cache?: RequestCache) => createApiClient({ baseUrl: BASE, messages: MESSAGES, failureOf, cache })

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = {}) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

const lastCall = () => fetchMock.mock.calls[0] as [string, RequestInit]

beforeEach(() => {
  stub(200)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createApiClient', () => {
  it('returns the parsed body of a successful response', async () => {
    stub(200, { slug: 'la-villette' })

    const result = await client().call<{ slug: string }>('/ateliers/la-villette')

    expect(result).toEqual({ ok: true, value: { slug: 'la-villette' } })
  })

  it('prefixes the path with the base url', async () => {
    await client().call('/ateliers')

    expect(lastCall()[0]).toBe(`${BASE}/ateliers`)
  })

  it('appends the defined query parameters and drops the undefined ones', async () => {
    await client().call('/ateliers', { query: { city: 'Paris', machineKind: undefined } })

    expect(lastCall()[0]).toBe(`${BASE}/ateliers?city=Paris`)
  })

  it('appends nothing when every query parameter is undefined', async () => {
    await client().call('/ateliers', { query: { city: undefined } })

    expect(lastCall()[0]).toBe(`${BASE}/ateliers`)
  })

  it('carries the token as a bearer authorization', async () => {
    await client().call('/auth/me', { token: 'jwt-42' })

    expect(lastCall()[1].headers).toMatchObject({ authorization: 'Bearer jwt-42' })
  })

  it('declares a json content type only when it sends a body', async () => {
    await client().call('/bookings', { method: 'POST', body: { machineId: 'm-1' } })
    const withBody = lastCall()[1]

    expect(withBody.headers).toMatchObject({ 'content-type': 'application/json' })
    expect(withBody.body).toBe(JSON.stringify({ machineId: 'm-1' }))

    stub(200)
    await client().call('/bookings')

    expect(lastCall()[1].headers).not.toHaveProperty('content-type')
  })

  it('defaults to GET and forwards the given method', async () => {
    await client().call('/bookings')
    expect(lastCall()[1].method).toBe('GET')

    stub(200)
    await client().call('/me/preferences', { method: 'PATCH', body: {} })
    expect(lastCall()[1].method).toBe('PATCH')
  })

  it('forwards the configured cache policy, and omits it when there is none', async () => {
    await client('no-store').call('/ateliers')
    expect(lastCall()[1].cache).toBe('no-store')

    stub(200)
    await client().call('/ateliers')
    expect(lastCall()[1]).not.toHaveProperty('cache')
  })

  it('lets a single call override the configured cache policy', async () => {
    await client().call('/onboarding', { method: 'POST', body: {}, cache: 'no-store' })

    expect(lastCall()[1].cache).toBe('no-store')
  })

  it('maps a refusal through failureOf and carries its message', async () => {
    stub(401, { code: 'UNAUTHORIZED' })

    const result = await client().call('/auth/me')

    expect(result).toEqual({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Session expirée.' } })
  })

  it('lets failureOf read the body, not just the status', async () => {
    stub(409, { code: 'ATELIER_UNKNOWN' })

    const result = await client().call('/ateliers/ghost')

    expect(result).toEqual({ ok: false, error: { code: 'NOT_FOUND', message: 'Introuvable.' } })
  })

  it('fails as unreachable when the request never gets an answer', async () => {
    fetchMock = vi.fn().mockRejectedValue(new TypeError('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await client().call('/ateliers')

    expect(result).toEqual({ ok: false, error: { code: 'UNREACHABLE', message: 'Service indisponible.' } })
  })

  it('fails as unreachable when a successful response carries no readable body', async () => {
    fetchMock = vi.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await client().call('/ateliers')

    expect(result).toEqual({ ok: false, error: { code: 'UNREACHABLE', message: 'Service indisponible.' } })
  })
})

describe('errorCodeOf', () => {
  it('reads the v2 code', () => {
    expect(errorCodeOf({ code: 'NFC_TAG_MISMATCH' })).toBe('NFC_TAG_MISMATCH')
  })

  it('reads nothing out of a body that names no error', () => {
    expect(errorCodeOf(null)).toBeUndefined()
    expect(errorCodeOf('nope')).toBeUndefined()
    expect(errorCodeOf({ message: 'nope' })).toBeUndefined()
    expect(errorCodeOf({ _tag: 'NfcTagMismatchError' })).toBeUndefined()
  })
})

const clientWith = (extra: Partial<ApiClientConfig<Code>>) =>
  createApiClient<Code>({ baseUrl: BASE, messages: MESSAGES, failureOf, ...extra })

describe('createApiClient auth', () => {
  it('takes the bearer from the configured provider', async () => {
    await clientWith({ getAuthToken: () => 'jwt-from-cookie' }).get('/auth/me')

    expect(lastCall()[1].headers).toMatchObject({ authorization: 'Bearer jwt-from-cookie' })
  })

  it('awaits an asynchronous provider', async () => {
    await clientWith({ getAuthToken: () => Promise.resolve('jwt-async') }).get('/auth/me')

    expect(lastCall()[1].headers).toMatchObject({ authorization: 'Bearer jwt-async' })
  })

  it('never asks the provider when the call carries its own token', async () => {
    const getAuthToken = vi.fn(() => 'from-provider')

    await clientWith({ getAuthToken }).get('/auth/me', { token: 'from-call' })

    expect(getAuthToken).not.toHaveBeenCalled()
    expect(lastCall()[1].headers).toMatchObject({ authorization: 'Bearer from-call' })
  })

  it.each([null, undefined, ''])('sends no authorization when the provider gives %j', async (empty) => {
    await clientWith({ getAuthToken: () => empty }).get('/ateliers')

    expect(lastCall()[1].headers).not.toHaveProperty('authorization')
  })

  it('leaves an anonymous client anonymous', async () => {
    const getAuthToken = vi.fn(() => 'jwt')

    await clientWith({}).get('/ateliers')
    await clientWith({ getAuthToken }).get('/ateliers')

    expect(getAuthToken).toHaveBeenCalledTimes(1)
  })
})

describe('createApiClient verbs', () => {
  it('sends a GET without a body', async () => {
    await clientWith({}).get('/bookings')

    expect(lastCall()[1].method).toBe('GET')
    expect(lastCall()[1].headers).not.toHaveProperty('content-type')
  })

  it('sends a POST with its body', async () => {
    await clientWith({}).post('/bookings', { machineId: 'm-1' })

    expect(lastCall()[1].method).toBe('POST')
    expect(lastCall()[1].body).toBe(JSON.stringify({ machineId: 'm-1' }))
  })

  it('sends a POST with no body at all when it has nothing to say', async () => {
    await clientWith({}).post('/bookings/b-1/cancel')

    expect(lastCall()[1].method).toBe('POST')
    expect(lastCall()[1]).not.toHaveProperty('body')
    expect(lastCall()[1].headers).not.toHaveProperty('content-type')
  })

  it('sends a PATCH with its body', async () => {
    await clientWith({}).patch('/me/preferences', { theme: 'dark' })

    expect(lastCall()[1].method).toBe('PATCH')
    expect(lastCall()[1].body).toBe(JSON.stringify({ theme: 'dark' }))
  })

  it('carries the query and the cache policy of a verb call', async () => {
    await clientWith({}).get('/ateliers', { query: { city: 'Paris' }, cache: 'no-store' })

    expect(lastCall()[0]).toBe(`${BASE}/ateliers?city=Paris`)
    expect(lastCall()[1].cache).toBe('no-store')
  })
})

describe('createApiClient transport', () => {
  it('calls the injected transport instead of the global fetch', async () => {
    const injected: FetchLike = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }))

    const result = await clientWith({ fetch: injected }).get<{ ok: number }>('/ateliers')

    expect(result).toEqual({ ok: true, value: { ok: 1 } })
    expect(injected).toHaveBeenCalledOnce()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

const hanging: FetchLike = (_url, init) =>
  new Promise((_resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'))
    if (init?.signal?.aborted === true) abort()
    else init?.signal?.addEventListener('abort', abort)
  })

describe('createApiClient deadline', () => {
  it('sends no signal when no timeout applies', async () => {
    await clientWith({}).get('/ateliers')

    expect(lastCall()[1]).not.toHaveProperty('signal')
  })

  it('forwards the caller signal untouched when no timeout applies', async () => {
    const controller = new AbortController()

    await clientWith({}).get('/ateliers', { signal: controller.signal })

    expect(lastCall()[1].signal).toBe(controller.signal)
  })

  it('fails as unreachable when the configured timeout runs out', async () => {
    const result = await clientWith({ fetch: hanging, timeoutMs: 5 }).get('/ateliers')

    expect(result).toEqual({ ok: false, error: { code: 'UNREACHABLE', message: 'Service indisponible.' } })
  })

  it('lets a single call shorten the configured timeout', async () => {
    const result = await clientWith({ fetch: hanging, timeoutMs: 60_000 }).get('/ateliers', { timeoutMs: 5 })

    expect(result).toEqual({ ok: false, error: { code: 'UNREACHABLE', message: 'Service indisponible.' } })
  })

  it('aborts at once when the caller signal is already aborted', async () => {
    const result = await clientWith({ fetch: hanging, timeoutMs: 60_000 }).get('/ateliers', {
      signal: AbortSignal.abort(),
    })

    expect(result).toEqual({ ok: false, error: { code: 'UNREACHABLE', message: 'Service indisponible.' } })
  })

  it('aborts when the caller signal fires before the timeout', async () => {
    const controller = new AbortController()
    const pending = clientWith({ fetch: hanging, timeoutMs: 60_000 }).get('/ateliers', { signal: controller.signal })
    controller.abort()

    expect(await pending).toEqual({ ok: false, error: { code: 'UNREACHABLE', message: 'Service indisponible.' } })
  })
})

describe('createApiClient empty bodies', () => {
  const respond = (response: Response) => {
    fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
  }

  it('succeeds on a 204 instead of reading it as unreachable', async () => {
    respond(new Response(null, { status: 204 }))

    expect(await clientWith({}).post('/bookings/b-1/cancel')).toEqual({ ok: true, value: undefined })
  })

  it('succeeds on a 200 that declares an empty body', async () => {
    respond(new Response('', { status: 200, headers: { 'content-length': '0' } }))

    expect(await clientWith({}).get('/ateliers')).toEqual({ ok: true, value: undefined })
  })

  it('still maps a refusal that carries no body through its status', async () => {
    respond(new Response(null, { status: 401 }))

    expect(await clientWith({}).get('/auth/me')).toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Session expirée.' },
    })
  })
})
