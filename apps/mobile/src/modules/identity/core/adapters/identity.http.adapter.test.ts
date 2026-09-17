import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityFailureCode } from '@/modules/identity/core/model/session'

import { IdentityHttpAdapter } from './identity.http.adapter'

const BASE = 'http://api.test'

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = {}) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

beforeEach(() => {
  stub(200, {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('IdentityHttpAdapter', () => {
  it('posts the credentials and hands back the session', async () => {
    stub(200, { token: 'jeton', expiresAt: '2026-09-18T12:00:00.000Z', user: { id: 'u-1' } })

    const result = await new IdentityHttpAdapter(BASE).login({ email: 'jean@example.org', password: 'etabli-2026' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/auth/login`)
    expect(init.method).toBe('POST')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.token).toBe('jeton')
  })

  it('reads the current user with a bearer token', async () => {
    stub(200, { id: 'u-1' })

    await new IdentityHttpAdapter(BASE).me('jeton')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/auth/me`)
    expect((init.headers as Record<string, string>)['authorization']).toBe('Bearer jeton')
  })

  it.each([
    ['INVALID_CREDENTIALS', 401, IdentityFailureCode.INVALID_CREDENTIALS],
    ['ACCOUNT_SUSPENDED', 403, IdentityFailureCode.ACCOUNT_SUSPENDED],
    ['VALIDATION_FAILED', 400, IdentityFailureCode.INVALID_INPUT],
    ['UNAUTHORIZED', 401, IdentityFailureCode.UNAUTHORIZED],
  ])('reads %s from the body rather than the status', async (code, status, expected) => {
    stub(status, { code, message: 'peu importe' })

    const result = await new IdentityHttpAdapter(BASE).login({ email: 'x@y.z', password: 'nope' })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(expected)
  })

  it('reads an expired session from a bare 401', async () => {
    stub(401, {})

    const result = await new IdentityHttpAdapter(BASE).me('périmé')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(IdentityFailureCode.UNAUTHORIZED)
  })
})
