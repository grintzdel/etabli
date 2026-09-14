export type CertificationStatus = 'PENDING' | 'GRANTED' | 'REVOKED'

export type Certification = {
  readonly id: string
  readonly userId: string
  readonly machineId: string
  readonly status: CertificationStatus
  readonly requestedAt: string
  readonly decidedAt: string | null
  readonly decidedBy: string | null
}

export type RequestCertificationInput = {
  readonly machineId: string
}

export type MyCertificationStatus = 'NONE' | CertificationStatus

export type MyCertification = {
  readonly certificationId: string | null
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly status: MyCertificationStatus
  readonly requestedAt: string | null
  readonly decidedAt: string | null
}

export type CertificationRequest = {
  readonly id: string
  readonly userId: string
  readonly memberName: string
  readonly machineId: string
  readonly machineName: string
  readonly atelierId: string
  readonly atelierName: string
  readonly status: CertificationStatus
  readonly requestedAt: string
  readonly decidedAt: string | null
}
