import type { MyCertification } from './certification'
import type { Membership } from './identity'

export const BookingEligibility = {
  ANONYMOUS: 'ANONYMOUS',
  NOT_MEMBER: 'NOT_MEMBER',
  CERTIFICATION_REQUIRED: 'CERTIFICATION_REQUIRED',
  CERTIFICATION_PENDING: 'CERTIFICATION_PENDING',
  READY: 'READY',
} as const
export type BookingEligibility = (typeof BookingEligibility)[keyof typeof BookingEligibility]

export type EligibilityMachine = {
  readonly id: string
  readonly atelierId: string
  readonly requiresCertification: boolean
}

export type EligibilityViewer = {
  readonly memberships: ReadonlyArray<Pick<Membership, 'atelierId'>>
  readonly certifications: ReadonlyArray<Pick<MyCertification, 'machineId' | 'status'>>
}

export const bookingEligibilityOf = (
  machine: EligibilityMachine,
  viewer: EligibilityViewer | null
): BookingEligibility => {
  if (viewer === null) return BookingEligibility.ANONYMOUS
  if (!viewer.memberships.some((membership) => membership.atelierId === machine.atelierId)) {
    return BookingEligibility.NOT_MEMBER
  }
  if (!machine.requiresCertification) return BookingEligibility.READY

  const status = viewer.certifications.find((certification) => certification.machineId === machine.id)?.status
  if (status === 'GRANTED') return BookingEligibility.READY
  if (status === 'PENDING') return BookingEligibility.CERTIFICATION_PENDING
  return BookingEligibility.CERTIFICATION_REQUIRED
}
