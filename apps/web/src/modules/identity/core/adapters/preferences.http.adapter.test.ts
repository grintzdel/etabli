import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityFailureCode } from '@/modules/identity/core/model/session'

import { PreferencesHttpAdapter } from './preferences.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'
const ATELIER = '00000000-0000-4000-8000-0000000000b1'

const STORED = { userId: 'u1', theme: 'light', defaultAtelierId: null, updatedAt: '2026-09-15T10:00:00.000Z' }

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = STORED) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

beforeEach(() => {
  stub(200)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PreferencesHttpAdapter', () => {
  it('reads the preferences with the bearer token', async () => {
    const result = await new PreferencesHttpAdapter(BASE).get(TOKEN)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/me/preferences`)
    expect(init.method).toBe('GET')
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(init.cache).toBe('no-store')
    expect(result.ok && result.value.theme).toBe('light')
  })

  it('patches only the keys it was given', async () => {
    await new PreferencesHttpAdapter(BASE).update(TOKEN, { theme: 'dark' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ theme: 'dark' })
  })

  it('carries an explicit null through, to clear the default atelier', async () => {
    await new PreferencesHttpAdapter(BASE).update(TOKEN, { defaultAtelierId: null })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ defaultAtelierId: null })
  })

  it('reads the refusal tag rather than the bare status', async () => {
    stub(409, { _tag: 'PreferredAtelierNotJoinedError', atelierId: ATELIER })

    const result = await new PreferencesHttpAdapter(BASE).update(TOKEN, { defaultAtelierId: ATELIER })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(IdentityFailureCode.PREFERRED_ATELIER_NOT_JOINED)
  })

  it('reads the ateliers the member joined', async () => {
    stub(200, [{ id: 'a1', slug: 'la-forge', name: 'La Forge', role: 'MEMBER' }])

    const result = await new PreferencesHttpAdapter(BASE).myAteliers(TOKEN)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/me/ateliers`)
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(result.ok && result.value[0]?.slug).toBe('la-forge')
  })

  it('reports an expired session on 401', async () => {
    stub(401, {})

    const result = await new PreferencesHttpAdapter(BASE).get(TOKEN)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(IdentityFailureCode.UNAUTHORIZED)
  })

  it('reports the service unreachable when fetch throws', async () => {
    fetchMock = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new PreferencesHttpAdapter(BASE).get(TOKEN)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(IdentityFailureCode.UNREACHABLE)
  })
})
