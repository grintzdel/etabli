import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApiClient } from './api-client'
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

  it('falls back on the v1 tag', () => {
    expect(errorCodeOf({ _tag: 'NfcTagMismatchError' })).toBe('NfcTagMismatchError')
  })

  it('prefers the code when a body carries both', () => {
    expect(errorCodeOf({ code: 'UNAUTHORIZED', _tag: 'UnauthorizedError' })).toBe('UNAUTHORIZED')
  })

  it('reads nothing out of a body that names no error', () => {
    expect(errorCodeOf(null)).toBeUndefined()
    expect(errorCodeOf('nope')).toBeUndefined()
    expect(errorCodeOf({ message: 'nope' })).toBeUndefined()
  })
})
