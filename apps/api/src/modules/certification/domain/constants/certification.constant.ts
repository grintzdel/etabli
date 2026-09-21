export const CertificationStatus = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  REVOKED: 'REVOKED',
} as const
export type CertificationStatus = (typeof CertificationStatus)[keyof typeof CertificationStatus]

export const CERTIFICATION_STATUSES = [
  CertificationStatus.PENDING,
  CertificationStatus.GRANTED,
  CertificationStatus.REVOKED,
] as const

export const MyCertificationStatus = {
  NONE: 'NONE',
  ...CertificationStatus,
} as const
export type MyCertificationStatus = (typeof MyCertificationStatus)[keyof typeof MyCertificationStatus]

export const MY_CERTIFICATION_STATUSES = [MyCertificationStatus.NONE, ...CERTIFICATION_STATUSES] as const

export const UNKNOWN_MEMBER = 'Compte supprimé'

export const QUEUE_RANK: Readonly<Record<CertificationStatus, number>> = {
  [CertificationStatus.PENDING]: 0,
  [CertificationStatus.GRANTED]: 1,
  [CertificationStatus.REVOKED]: 2,
}
