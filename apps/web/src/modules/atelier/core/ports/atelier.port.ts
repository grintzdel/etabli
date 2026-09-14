import type { AtelierDetail, AtelierResult, AtelierSummary, DirectoryFilters } from '../model/atelier'

export interface IAtelierPort {
  list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>>
  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>>
}
