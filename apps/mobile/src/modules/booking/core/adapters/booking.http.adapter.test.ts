import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'

import { BookingHttpAdapter } from './booking.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = {}) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

const callOf = (): [string, RequestInit] => fetchMock.mock.calls[0] as [string, RequestInit]

beforeEach(() => {
  stub(200, [])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BookingHttpAdapter', () => {
  it('carries the bearer token', async () => {
    await new BookingHttpAdapter(BASE).list(TOKEN)

    const [url, init] = callOf()
    expect(url).toBe(`${BASE}/bookings`)
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
  })

  it('asks a machine for the week it opens', async () => {
    stub(200, { machineId: 'abc', slots: [] })

    await new BookingHttpAdapter(BASE).availability(TOKEN, 'abc', '2026-06-08T00:00:00.000Z')

    expect(callOf()[0]).toBe(`${BASE}/machines/abc/availability?from=2026-06-08T00%3A00%3A00.000Z`)
  })

  it('leaves the week out when none is asked for', async () => {
    stub(200, { machineId: 'abc', slots: [] })

    await new BookingHttpAdapter(BASE).availability(TOKEN, 'abc')

    expect(callOf()[0]).toBe(`${BASE}/machines/abc/availability`)
  })

  it('posts the machine and the start of the slot, and nothing else', async () => {
    stub(201, bookingDetailFixture())

    await new BookingHttpAdapter(BASE).create(TOKEN, { machineId: 'abc', startAt: '2026-06-08T12:00:00.000Z' })

    const [url, init] = callOf()
    expect(url).toBe(`${BASE}/bookings`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ machineId: 'abc', startAt: '2026-06-08T12:00:00.000Z' })
  })

  it('sends the tag it was handed, and only the tag', async () => {
    stub(200, bookingDetailFixture({ status: 'CHECKED_IN' }))

    await new BookingHttpAdapter(BASE).checkIn(TOKEN, 'b-1', '04:A2:24:B1')

    const [url, init] = callOf()
    expect(url).toBe(`${BASE}/bookings/b-1/check-in`)
    expect(JSON.parse(String(init.body))).toEqual({ nfcTagId: '04:A2:24:B1' })
  })

  it.each([
    ['MACHINE_NOT_BOOKABLE', 404, BookingFailureCode.MACHINE_NOT_BOOKABLE],
    ['MACHINE_UNAVAILABLE', 409, BookingFailureCode.MACHINE_UNAVAILABLE],
    ['MISSING_CERTIFICATION', 403, BookingFailureCode.MISSING_CERTIFICATION],
    ['SLOT_IN_THE_PAST', 409, BookingFailureCode.SLOT_IN_THE_PAST],
    ['BOOKING_OVERLAP', 409, BookingFailureCode.SLOT_TAKEN],
    ['BOOKING_UNKNOWN', 404, BookingFailureCode.BOOKING_UNKNOWN],
    ['BOOKING_NOT_CANCELLABLE', 409, BookingFailureCode.NOT_CANCELLABLE],
    ['BOOKING_NOT_CHECK_INABLE', 409, BookingFailureCode.NOT_CHECK_INABLE],
    ['CHECK_IN_WINDOW_CLOSED', 409, BookingFailureCode.CHECK_IN_WINDOW_CLOSED],
    ['NFC_TAG_MISMATCH', 409, BookingFailureCode.NFC_TAG_MISMATCH],
    ['VALIDATION_FAILED', 400, BookingFailureCode.INVALID_INPUT],
    ['UNAUTHORIZED', 401, BookingFailureCode.UNAUTHORIZED],
  ])('reads %s from the body rather than the status', async (code, status, expected) => {
    stub(status, { code, message: 'peu importe' })

    const result = await new BookingHttpAdapter(BASE).create(TOKEN, { machineId: 'abc', startAt: 'x' })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(expected)
  })

  it('falls back on the status when the body carries no code', async () => {
    stub(409, { message: 'boum' })

    const result = await new BookingHttpAdapter(BASE).cancel(TOKEN, 'b-1')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(BookingFailureCode.UNREACHABLE)
  })

  it('turns a dead network into an unreachable refusal', async () => {
    fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new BookingHttpAdapter(BASE).list(TOKEN)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(BookingFailureCode.UNREACHABLE)
  })
})

describe('BookingHttpAdapter against the Effect API it replaces', () => {
  it('reads a _tag when the body carries no code', async () => {
    stub(409, { _tag: 'NfcTagMismatchError' })

    const result = await new BookingHttpAdapter(BASE).checkIn(TOKEN, 'b-1', 'mauvais')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(BookingFailureCode.NFC_TAG_MISMATCH)
  })
})
