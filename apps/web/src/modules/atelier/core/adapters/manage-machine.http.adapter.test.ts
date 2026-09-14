import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AtelierFailureCode } from '../model/atelier'
import { ManageMachineHttpAdapter } from './manage-machine.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'

const respond = (status: number, body: unknown = {}) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

const machine = {
  atelierId: '10000000-0000-4000-8000-000000000001',
  name: 'Trotec Speedy',
  kind: 'LASER_CUTTER',
} as const

let fetchMock: ReturnType<typeof respond>

beforeEach(() => {
  fetchMock = respond(200, [])
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ManageMachineHttpAdapter', () => {
  it('carries the bearer token and never caches', async () => {
    await new ManageMachineHttpAdapter(BASE).listParcs(TOKEN)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/manage/machines`)
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(init.cache).toBe('no-store')
  })

  it('posts the machine on create', async () => {
    fetchMock = respond(201, { id: 'abc' })
    vi.stubGlobal('fetch', fetchMock)

    await new ManageMachineHttpAdapter(BASE).create(TOKEN, machine)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(machine)
  })

  it('patches the machine on its own id', async () => {
    await new ManageMachineHttpAdapter(BASE).update(TOKEN, 'abc', { status: 'RETIRED' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/manage/machines/abc`)
    expect(init.method).toBe('PATCH')
  })

  it('reads a refused creation as forbidden', async () => {
    fetchMock = respond(403)
    vi.stubGlobal('fetch', fetchMock)

    const result = await new ManageMachineHttpAdapter(BASE).create(TOKEN, machine)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(AtelierFailureCode.FORBIDDEN)
  })

  it('reads a machine of another atelier as not found', async () => {
    fetchMock = respond(404)
    vi.stubGlobal('fetch', fetchMock)

    const result = await new ManageMachineHttpAdapter(BASE).update(TOKEN, 'abc', { status: 'RETIRED' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(AtelierFailureCode.NOT_FOUND)
  })

  it('reads an unreachable api as such', async () => {
    fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new ManageMachineHttpAdapter(BASE).listParcs(TOKEN)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(AtelierFailureCode.UNREACHABLE)
  })
})
