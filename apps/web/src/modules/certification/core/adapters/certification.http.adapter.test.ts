import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CertificationFailureCode } from '../model/certification'
import { CertificationHttpAdapter } from './certification.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'

const respond = (status: number, body: unknown = {}) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

let fetchMock: ReturnType<typeof respond>

beforeEach(() => {
  fetchMock = respond(200, [])
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CertificationHttpAdapter', () => {
  it('carries the bearer token and never caches', async () => {
    await new CertificationHttpAdapter(BASE).mine(TOKEN)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/certifications/mine`)
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(init.cache).toBe('no-store')
  })

  it('posts the machine id when asking for an habilitation', async () => {
    fetchMock = respond(201, {})
    vi.stubGlobal('fetch', fetchMock)

    await new CertificationHttpAdapter(BASE).request(TOKEN, 'machine-1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/certifications`)
    expect(JSON.parse(init.body as string)).toEqual({ machineId: 'machine-1' })
  })

  it('posts on the grant and revoke paths of the certification', async () => {
    const adapter = new CertificationHttpAdapter(BASE)
    await adapter.grant(TOKEN, 'abc')
    await adapter.revoke(TOKEN, 'abc')

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(`${BASE}/manage/certifications/abc/grant`)
    expect((fetchMock.mock.calls[1] as [string])[0]).toBe(`${BASE}/manage/certifications/abc/revoke`)
  })

  it('reads a 409 as a request already in flight', async () => {
    fetchMock = respond(409)
    vi.stubGlobal('fetch', fetchMock)

    const result = await new CertificationHttpAdapter(BASE).request(TOKEN, 'machine-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(CertificationFailureCode.ALREADY_REQUESTED)
  })

  it('reads a 404 as a machine that takes no request', async () => {
    fetchMock = respond(404)
    vi.stubGlobal('fetch', fetchMock)

    const result = await new CertificationHttpAdapter(BASE).request(TOKEN, 'machine-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(CertificationFailureCode.NOT_CERTIFIABLE)
  })

  it('reads an unreachable api as such', async () => {
    fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new CertificationHttpAdapter(BASE).mine(TOKEN)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(CertificationFailureCode.UNREACHABLE)
  })
})

describe('CertificationHttpAdapter · refus de la file', () => {
  it('names a request that is not the caller’s to review, rather than an uncertifiable machine', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ _tag: 'CertificationUnknownError', certificationId: 'c-1' }), { status: 404 })
        )
    )

    const result = await new CertificationHttpAdapter(BASE).grant(TOKEN, 'c-1')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(CertificationFailureCode.CERTIFICATION_UNKNOWN)
  })
})
