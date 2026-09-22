import type { CertificationResult, MyCertification } from '../model/certification'

export interface ICertificationPort {
  mine(): Promise<CertificationResult<ReadonlyArray<MyCertification>>>
  request(machineId: string): Promise<CertificationResult<void>>
}
