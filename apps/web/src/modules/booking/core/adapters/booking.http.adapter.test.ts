import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'

import { BookingHttpAdapter } from './booking.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'

const respond = (status: number, body: unknown = {}) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

let fetchMock: ReturnType<typeof respond>

const stub = (status: number, body: unknown = {}) => {
  fetchMock = respond(status, body)
  vi.stubGlobal('fetch', fetchMock)
}

beforeEach(() => {
  stub(200, [])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BookingHttpAdapter', () => {
  it('carries the bearer token and never caches', async () => {
    await new BookingHttpAdapter(BASE).list(TOKEN)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/bookings`)
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(init.cache).toBe('no-store')
  })

  it('asks a machine for the week it opens', async () => {
    stub(200, { machineId: 'abc', slots: [] })

    await new BookingHttpAdapter(BASE).availability(TOKEN, 'abc', '2026-06-08T00:00:00.000Z')

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/machines/abc/availability?from=2026-06-08T00%3A00%3A00.000Z`)
  })

  it('leaves the week out when none is asked for', async () => {
    stub(200, { machineId: 'abc', slots: [] })

    await new BookingHttpAdapter(BASE).availability(TOKEN, 'abc')

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/machines/abc/availability`)
  })

  it('posts the machine and the start of the slot, and nothing else', async () => {
    stub(201, bookingDetailFixture())

    await new BookingHttpAdapter(BASE).create(TOKEN, {
      machineId: 'abc',
      startAt: '2026-06-08T08:00:00.000Z',
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/bookings`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      machineId: 'abc',
      startAt: '2026-06-08T08:00:00.000Z',
    })
  })

  it('tells the three refusals of a creation apart', async () => {
    stub(409, { _tag: 'BookingOverlapError', machineId: 'abc' })
    const taken = await new BookingHttpAdapter(BASE).create(TOKEN, { machineId: 'abc', startAt: 'x' })
    expect(!taken.ok && taken.error.code).toBe(BookingFailureCode.SLOT_TAKEN)

    stub(403, { _tag: 'MissingCertificationError', machineId: 'abc' })
    const uncertified = await new BookingHttpAdapter(BASE).create(TOKEN, { machineId: 'abc', startAt: 'x' })
    expect(!uncertified.ok && uncertified.error.code).toBe(BookingFailureCode.MISSING_CERTIFICATION)

    stub(409, { _tag: 'MachineUnavailableError', machineId: 'abc', status: 'MAINTENANCE' })
    const down = await new BookingHttpAdapter(BASE).create(TOKEN, { machineId: 'abc', startAt: 'x' })
    expect(!down.ok && down.error.code).toBe(BookingFailureCode.MACHINE_UNAVAILABLE)
  })

  it('reads one booking on its own id', async () => {
    stub(200, bookingDetailFixture())

    await new BookingHttpAdapter(BASE).getById(TOKEN, 'abc')

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/bookings/abc`)
  })

  it('posts the cancellation', async () => {
    stub(200, bookingDetailFixture({ status: 'CANCELLED' }))

    const result = await new BookingHttpAdapter(BASE).cancel(TOKEN, 'abc')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/bookings/abc/cancel`)
    expect(init.method).toBe('POST')
    expect(result.ok && result.value.status).toBe('CANCELLED')
  })

  it('names the broken rule from the error tag', async () => {
    stub(409, { _tag: 'BookingNotCancellableError', bookingId: 'abc' })
    const refused = await new BookingHttpAdapter(BASE).cancel(TOKEN, 'abc')
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.error.code).toBe(BookingFailureCode.NOT_CANCELLABLE)

    stub(404, { _tag: 'BookingUnknownError', bookingId: 'abc' })
    const unknown = await new BookingHttpAdapter(BASE).cancel(TOKEN, 'abc')
    expect(!unknown.ok && unknown.error.code).toBe(BookingFailureCode.BOOKING_UNKNOWN)
  })

  it('falls back on the status when the body names no error', async () => {
    stub(401, {})
    const result = await new BookingHttpAdapter(BASE).list(TOKEN)
    expect(!result.ok && result.error.code).toBe(BookingFailureCode.UNAUTHORIZED)
  })

  it('reads an unreachable API as such', async () => {
    fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new BookingHttpAdapter(BASE).list(TOKEN)
    expect(!result.ok && result.error.code).toBe(BookingFailureCode.UNREACHABLE)
  })
})
