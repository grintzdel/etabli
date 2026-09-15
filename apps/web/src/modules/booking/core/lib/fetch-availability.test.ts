import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FAILURE_MESSAGES } from '../model/booking'
import { fetchAvailability } from './fetch-availability'

const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

let fetchMock: ReturnType<typeof respond>

beforeEach(() => {
  fetchMock = respond(200, { machineId: 'abc', slots: [] })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchAvailability', () => {
  it('asks the route handler, never the API', async () => {
    await fetchAvailability('abc')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/machines/abc/availability')
  })

  it('carries the start of the week it wants', async () => {
    await fetchAvailability('abc', '2026-06-08T00:00:00.000Z')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/machines/abc/availability?from=2026-06-08T00%3A00%3A00.000Z')
  })

  it('throws the sentence the handler gave', async () => {
    fetchMock = respond(404, { code: 'MACHINE_NOT_BOOKABLE', message: FAILURE_MESSAGES.MACHINE_NOT_BOOKABLE })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchAvailability('abc')).rejects.toThrow(FAILURE_MESSAGES.MACHINE_NOT_BOOKABLE)
  })

  it('falls back on its own sentence when the handler gave none', async () => {
    fetchMock = vi.fn().mockResolvedValue(new Response('boom', { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchAvailability('abc')).rejects.toThrow(FAILURE_MESSAGES.UNREACHABLE)
  })
})
