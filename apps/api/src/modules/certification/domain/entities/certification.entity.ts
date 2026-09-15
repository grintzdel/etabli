import type { CertificationStatus, MyCertificationStatus } from '../constants/certification.constant.ts'

export interface CertificationEntity {
  readonly id: string
  readonly userId: string
  readonly machineId: string
  readonly status: CertificationStatus
  readonly requestedAt: Date
  readonly decidedAt: Date | null
  readonly decidedBy: string | null
}

export interface MyCertification {
  readonly certificationId: string | null
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly status: MyCertificationStatus
  readonly requestedAt: Date | null
  readonly decidedAt: Date | null
}

export interface CertificationRequest {
  readonly id: string
  readonly userId: string
  readonly memberName: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly status: CertificationStatus
  readonly requestedAt: Date
  readonly decidedAt: Date | null
}
