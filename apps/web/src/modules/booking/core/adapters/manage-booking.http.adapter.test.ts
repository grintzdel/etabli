import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { atelierBookingFixture } from '@/modules/booking/__tests__/booking.factory'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'

import { ManageBookingHttpAdapter } from './manage-booking.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'
const DAY = '2026-06-01T12:00:00.000Z'

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = {}) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

beforeEach(() => {
  stub(200, [])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ManageBookingHttpAdapter', () => {
  it('asks for a day and carries the bearer token', async () => {
    await new ManageBookingHttpAdapter(BASE).list(TOKEN, { date: DAY })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/manage/bookings?date=2026-06-01T12%3A00%3A00.000Z`)
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(init.cache).toBe('no-store')
  })

  it('carries the status when one is asked for', async () => {
    await new ManageBookingHttpAdapter(BASE).list(TOKEN, { date: DAY, status: 'CHECKED_IN' })

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('status=CHECKED_IN')
  })

  it('posts the manual check-in of one booking', async () => {
    stub(200, atelierBookingFixture())

    const result = await new ManageBookingHttpAdapter(BASE).checkIn(TOKEN, 'booking-1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/manage/bookings/booking-1/check-in`)
    expect(init.method).toBe('POST')
    expect(result.ok).toBe(true)
  })

  it('tells a slot already stamped apart from a window that closed', async () => {
    stub(409, { _tag: 'BookingNotCheckInableError' })
    const stamped = await new ManageBookingHttpAdapter(BASE).checkIn(TOKEN, 'booking-1')

    stub(409, { _tag: 'CheckInWindowClosedError' })
    const closed = await new ManageBookingHttpAdapter(BASE).checkIn(TOKEN, 'booking-1')

    expect(stamped.ok).toBe(false)
    expect(closed.ok).toBe(false)
    if (stamped.ok || closed.ok) return
    expect(stamped.error.code).toBe(BookingFailureCode.NOT_CHECK_INABLE)
    expect(closed.error.code).toBe(BookingFailureCode.CHECK_IN_WINDOW_CLOSED)
  })

  it('posts the no-show of one booking', async () => {
    stub(200, atelierBookingFixture({ status: 'NO_SHOW' }))

    const result = await new ManageBookingHttpAdapter(BASE).markNoShow(TOKEN, 'booking-1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/manage/bookings/booking-1/no-show`)
    expect(init.method).toBe('POST')
    expect(result.ok).toBe(true)
  })

  it('tells a no-show that came too early from the rest', async () => {
    stub(409, { _tag: 'BookingNotMarkableAsNoShowError' })

    const result = await new ManageBookingHttpAdapter(BASE).markNoShow(TOKEN, 'booking-1')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(BookingFailureCode.NOT_MARKABLE_AS_NO_SHOW)
  })

  it('reads a booking it may not touch as unknown', async () => {
    stub(404, { _tag: 'BookingUnknownError' })

    const result = await new ManageBookingHttpAdapter(BASE).checkIn(TOKEN, 'booking-1')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(BookingFailureCode.BOOKING_UNKNOWN)
  })
})
