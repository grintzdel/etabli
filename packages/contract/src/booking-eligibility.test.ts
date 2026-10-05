import { describe, expect, it } from 'vitest'

import { BookingEligibility, bookingEligibilityOf, type EligibilityViewer } from './booking-eligibility'

const laser = { id: 'laser', atelierId: 'forge', requiresCertification: true }
const printer = { id: 'printer', atelierId: 'forge', requiresCertification: false }

const member = (certifications: EligibilityViewer['certifications'] = []): EligibilityViewer => ({
  memberships: [{ atelierId: 'forge' }],
  certifications,
})

describe('bookingEligibilityOf', () => {
  it('asks an anonymous visitor to sign in', () => {
    expect(bookingEligibilityOf(printer, null)).toBe(BookingEligibility.ANONYMOUS)
  })

  it('asks a member of another atelier to join this one', () => {
    expect(bookingEligibilityOf(printer, { memberships: [{ atelierId: 'copeaux' }], certifications: [] })).toBe(
      BookingEligibility.NOT_MEMBER
    )
  })

  it('lets a member book a machine that requires no certification', () => {
    expect(bookingEligibilityOf(printer, member())).toBe(BookingEligibility.READY)
  })

  it('lets a certified member book a machine that requires a certification', () => {
    expect(bookingEligibilityOf(laser, member([{ machineId: 'laser', status: 'GRANTED' }]))).toBe(
      BookingEligibility.READY
    )
  })

  it('tells a member whose request is pending to wait for the fabmanager', () => {
    expect(bookingEligibilityOf(laser, member([{ machineId: 'laser', status: 'PENDING' }]))).toBe(
      BookingEligibility.CERTIFICATION_PENDING
    )
  })

  it.each(['NONE', 'REVOKED'] as const)('asks a member to request the certification when it is %s', (status) => {
    expect(bookingEligibilityOf(laser, member([{ machineId: 'laser', status }]))).toBe(
      BookingEligibility.CERTIFICATION_REQUIRED
    )
  })

  it('ignores a certification granted on another machine', () => {
    expect(bookingEligibilityOf(laser, member([{ machineId: 'printer', status: 'GRANTED' }]))).toBe(
      BookingEligibility.CERTIFICATION_REQUIRED
    )
  })
})
