import type { CertificationStatus } from '../constants/certification.constant.ts'
import type { CertificationEntity } from '../entities/certification.entity.ts'

export type NewCertification = Omit<CertificationEntity, 'decidedAt' | 'decidedBy'>

export interface ICertificationRepository {
  findById(id: string): Promise<CertificationEntity | null>
  findForUserAndMachine(userId: string, machineId: string): Promise<CertificationEntity | null>
  listForUser(userId: string): Promise<ReadonlyArray<CertificationEntity>>
  listForMachines(machineIds: ReadonlyArray<string>): Promise<ReadonlyArray<CertificationEntity>>
  isCertified(userId: string, machineId: string): Promise<boolean>
  insert(certification: NewCertification): Promise<CertificationEntity>
  reopen(id: string, at: Date): Promise<CertificationEntity | null>
  decide(id: string, status: CertificationStatus, decidedBy: string, at: Date): Promise<CertificationEntity | null>
}
