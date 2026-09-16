import type { BookingDetail } from '@/modules/booking/core/model/booking'
import { isUpcoming } from '@/modules/booking/core/model/booking'
import type { MyCertification } from '@/modules/certification/core/model/certification'

export interface OverviewInput {
  readonly bookings: ReadonlyArray<BookingDetail>
  readonly certifications: ReadonlyArray<MyCertification>
  readonly atelierCount: number
  readonly now: Date
}

export interface Overview {
  readonly nextBooking: BookingDetail | null
  readonly upcomingCount: number
  readonly checkInReadyCount: number
  readonly pendingCertifications: ReadonlyArray<MyCertification>
  readonly grantedCount: number
  readonly atelierCount: number
}

export const buildOverview = ({ bookings, certifications, atelierCount, now }: OverviewInput): Overview => {
  const upcoming = bookings
    .filter((booking) => isUpcoming(booking, now))
    .toSorted((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())

  return {
    nextBooking: upcoming[0] ?? null,
    upcomingCount: upcoming.length,
    checkInReadyCount: bookings.filter((booking) => booking.canCheckIn).length,
    pendingCertifications: certifications.filter((certification) => certification.status === 'PENDING'),
    grantedCount: certifications.filter((certification) => certification.status === 'GRANTED').length,
    atelierCount,
  }
}
