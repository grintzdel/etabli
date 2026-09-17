import type { AtelierDetail, AtelierResult, AtelierSummary, DirectoryPoint, MachineDetail } from '../model/atelier'

export interface IAtelierPort {
  list(point: DirectoryPoint | null): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>>
  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>>
  getMachineById(id: string): Promise<AtelierResult<MachineDetail>>
}
