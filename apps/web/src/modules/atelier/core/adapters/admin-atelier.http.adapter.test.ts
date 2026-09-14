import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AtelierFailureCode } from '../model/atelier'
import { AdminAtelierHttpAdapter } from './admin-atelier.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'

const respond = (status: number, body: unknown = {}) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

const draft = {
  slug: 'la-forge',
  name: 'La Forge',
  city: 'Montreuil',
  latitude: 48.8638,
  longitude: 2.4485,
}

let fetchMock: ReturnType<typeof respond>

beforeEach(() => {
  fetchMock = respond(200, [])
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AdminAtelierHttpAdapter', () => {
  it('carries the bearer token on every call', async () => {
    await new AdminAtelierHttpAdapter(BASE).list(TOKEN)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
  })

  it('never caches, so a fresh draft shows up immediately', async () => {
    await new AdminAtelierHttpAdapter(BASE).list(TOKEN)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.cache).toBe('no-store')
  })

  it('posts the atelier on create', async () => {
    fetchMock = respond(201, { id: 'abc' })
    vi.stubGlobal('fetch', fetchMock)

    await new AdminAtelierHttpAdapter(BASE).create(TOKEN, draft)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/admin/ateliers`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(draft)
  })

  it('patches the status on the atelier id', async () => {
    await new AdminAtelierHttpAdapter(BASE).setStatus(TOKEN, 'abc', { status: 'PUBLISHED' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/admin/ateliers/abc`)
    expect(init.method).toBe('PATCH')
  })

  it('tells a forbidden page from an expired session', async () => {
    fetchMock = respond(403)
    vi.stubGlobal('fetch', fetchMock)

    const result = await new AdminAtelierHttpAdapter(BASE).list(TOKEN)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(AtelierFailureCode.FORBIDDEN)
  })

  it('reads a 409 as a slug already taken', async () => {
    fetchMock = respond(409)
    vi.stubGlobal('fetch', fetchMock)

    const result = await new AdminAtelierHttpAdapter(BASE).create(TOKEN, draft)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(AtelierFailureCode.SLUG_TAKEN)
  })

  it('reads an unreachable api as such', async () => {
    fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new AdminAtelierHttpAdapter(BASE).list(TOKEN)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(AtelierFailureCode.UNREACHABLE)
  })
})
