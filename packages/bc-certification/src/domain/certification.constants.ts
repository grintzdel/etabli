export const CertificationStatus = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  REVOKED: 'REVOKED',
} as const
export type CertificationStatus = (typeof CertificationStatus)[keyof typeof CertificationStatus]
