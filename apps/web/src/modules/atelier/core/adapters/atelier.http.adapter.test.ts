import { afterEach, describe, expect, it, vi } from 'vitest'

import { detailFixture, summaryFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { AtelierHttpAdapter } from './atelier.http.adapter'

const BASE = 'http://api.test'

const respondWith = (status: number, body: unknown) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

afterEach(() => vi.restoreAllMocks())

const urlOf = (mock: ReturnType<typeof respondWith>): string => String(mock.mock.calls[0]?.[0])

describe('AtelierHttpAdapter.list', () => {
  it('calls the directory without a query string when no filter is set', async () => {
    const fetchMock = respondWith(200, [])
    await new AtelierHttpAdapter(BASE).list({})
    expect(urlOf(fetchMock)).toBe(`${BASE}/ateliers`)
  })

  it('carries the filters as query parameters', async () => {
    const fetchMock = respondWith(200, [])
    await new AtelierHttpAdapter(BASE).list({ city: 'Montreuil', machineKind: 'SEWING' })
    expect(urlOf(fetchMock)).toBe(`${BASE}/ateliers?city=Montreuil&machineKind=SEWING`)
  })

  it('answers the summaries on success', async () => {
    const fixture = [summaryFixture()]
    respondWith(200, fixture)

    const result = await new AtelierHttpAdapter(BASE).list({})
    expect(result).toEqual({ ok: true, value: fixture })
  })

  it('turns a 400 into an invalid-filter failure', async () => {
    respondWith(400, { _tag: 'ParseError' })
    const result = await new AtelierHttpAdapter(BASE).list({})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_FILTER')
  })

  it('turns an unreachable API into an unreachable failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))
    const result = await new AtelierHttpAdapter(BASE).list({})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('UNREACHABLE')
  })
})

describe('AtelierHttpAdapter.getBySlug', () => {
  it('builds the sheet path from the contract template', async () => {
    const fetchMock = respondWith(200, detailFixture())
    await new AtelierHttpAdapter(BASE).getBySlug('la-forge')
    expect(urlOf(fetchMock)).toBe(`${BASE}/ateliers/la-forge`)
  })

  it('escapes a slug that would otherwise change the path', async () => {
    const fetchMock = respondWith(404, {})
    await new AtelierHttpAdapter(BASE).getBySlug('../auth/me')
    expect(urlOf(fetchMock)).toBe(`${BASE}/ateliers/..%2Fauth%2Fme`)
  })

  it('turns a 404 into a not-found failure', async () => {
    respondWith(404, { _tag: 'AtelierNotFoundError' })
    const result = await new AtelierHttpAdapter(BASE).getBySlug('inconnu')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
  })
})
