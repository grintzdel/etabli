import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AtelierFailureCode, DIRECTORY_RADIUS_KM } from '@/modules/atelier/core/model/atelier'

import { AtelierHttpAdapter } from './atelier.http.adapter'

const BASE = 'http://api.test'

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = []) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

beforeEach(() => {
  stub(200, [])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AtelierHttpAdapter', () => {
  it('sends the three geo parameters together', async () => {
    await new AtelierHttpAdapter(BASE).list({ latitude: 48.8566, longitude: 2.3522 })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe(`${BASE}/ateliers?lat=48.8566&lng=2.3522&radiusKm=${DIRECTORY_RADIUS_KM}`)
  })

  it('sends none of them when the position was refused', async () => {
    await new AtelierHttpAdapter(BASE).list(null)

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(`${BASE}/ateliers`)
  })

  it('reads an atelier by slug', async () => {
    stub(200, { slug: 'la-villette' })

    await new AtelierHttpAdapter(BASE).getBySlug('la-villette')

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(`${BASE}/ateliers/la-villette`)
  })

  it.each([
    ['ATELIER_NOT_FOUND', 404, AtelierFailureCode.NOT_FOUND],
    ['MACHINE_UNKNOWN', 404, AtelierFailureCode.NOT_FOUND],
    ['VALIDATION_FAILED', 400, AtelierFailureCode.INVALID_FILTER],
    ['UNAUTHORIZED', 401, AtelierFailureCode.UNAUTHORIZED],
  ])('reads %s from the body rather than the status', async (code, status, expected) => {
    stub(status, { code, message: 'peu importe' })

    const result = await new AtelierHttpAdapter(BASE).getMachineById('m-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(expected)
  })

  it('turns a dead network into an unreachable directory', async () => {
    fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new AtelierHttpAdapter(BASE).list(null)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(AtelierFailureCode.UNREACHABLE)
  })
})
