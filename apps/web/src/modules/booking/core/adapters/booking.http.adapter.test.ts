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
