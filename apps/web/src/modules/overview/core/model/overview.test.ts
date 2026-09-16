import { describe, expect, it } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'
import { myCertificationFixture } from '@/modules/certification/__tests__/certification.factory'

import { buildOverview } from './overview'

const now = new Date('2026-06-01T07:00:00.000Z')

describe('buildOverview', () => {
  it('picks the soonest upcoming booking as the next one', () => {
    const later = bookingDetailFixture({ startAt: '2026-06-03T08:00:00.000Z', endAt: '2026-06-03T10:00:00.000Z' })
    const sooner = bookingDetailFixture({ startAt: '2026-06-01T08:00:00.000Z', endAt: '2026-06-01T10:00:00.000Z' })

    const overview = buildOverview({ bookings: [later, sooner], certifications: [], atelierCount: 1, now })

    expect(overview.nextBooking?.id).toBe(sooner.id)
    expect(overview.upcomingCount).toBe(2)
  })

  it('leaves the next booking empty when every booking is behind us', () => {
    const past = bookingDetailFixture({ startAt: '2026-05-01T08:00:00.000Z', endAt: '2026-05-01T10:00:00.000Z' })

    const overview = buildOverview({ bookings: [past], certifications: [], atelierCount: 1, now })

    expect(overview.nextBooking).toBeNull()
    expect(overview.upcomingCount).toBe(0)
  })

  it('ignores a cancelled booking even when its slot is still ahead', () => {
    const cancelled = bookingDetailFixture({
      startAt: '2026-06-02T08:00:00.000Z',
      endAt: '2026-06-02T10:00:00.000Z',
      status: 'CANCELLED',
    })

    const overview = buildOverview({ bookings: [cancelled], certifications: [], atelierCount: 1, now })

    expect(overview.nextBooking).toBeNull()
  })

  it('counts the bookings the member can already check in on', () => {
    const ready = bookingDetailFixture({ canCheckIn: true })
    const notYet = bookingDetailFixture({ canCheckIn: false })

    const overview = buildOverview({ bookings: [ready, notYet], certifications: [], atelierCount: 1, now })

    expect(overview.checkInReadyCount).toBe(1)
  })

  it('separates the certifications awaiting a decision from those granted', () => {
    const overview = buildOverview({
      bookings: [],
      certifications: [
        myCertificationFixture({ status: 'PENDING' }),
        myCertificationFixture({ status: 'PENDING' }),
        myCertificationFixture({ status: 'GRANTED' }),
        myCertificationFixture({ status: 'NONE' }),
        myCertificationFixture({ status: 'REVOKED' }),
      ],
      atelierCount: 2,
      now,
    })

    expect(overview.pendingCertifications).toHaveLength(2)
    expect(overview.grantedCount).toBe(1)
  })

  it('reports an empty product for a member who just finished onboarding', () => {
    const overview = buildOverview({ bookings: [], certifications: [], atelierCount: 0, now })

    expect(overview).toEqual({
      nextBooking: null,
      upcomingCount: 0,
      checkInReadyCount: 0,
      pendingCertifications: [],
      grantedCount: 0,
      atelierCount: 0,
    })
  })
})
