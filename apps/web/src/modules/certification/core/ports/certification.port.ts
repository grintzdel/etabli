import type { CertificationRequest, CertificationResult, MyCertification } from '../model/certification'

export interface ICertificationPort {
  mine(): Promise<CertificationResult<ReadonlyArray<MyCertification>>>
  request(machineId: string): Promise<CertificationResult<void>>
  queue(): Promise<CertificationResult<ReadonlyArray<CertificationRequest>>>
  grant(certificationId: string): Promise<CertificationResult<void>>
  revoke(certificationId: string): Promise<CertificationResult<void>>
}
