import type { CertificationRequest, CertificationResult, MyCertification } from '../model/certification'

export interface ICertificationPort {
  mine(token: string): Promise<CertificationResult<ReadonlyArray<MyCertification>>>
  request(token: string, machineId: string): Promise<CertificationResult<void>>
  queue(token: string): Promise<CertificationResult<ReadonlyArray<CertificationRequest>>>
  grant(token: string, certificationId: string): Promise<CertificationResult<void>>
  revoke(token: string, certificationId: string): Promise<CertificationResult<void>>
}
