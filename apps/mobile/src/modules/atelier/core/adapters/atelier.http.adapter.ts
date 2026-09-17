import { buildPath, routes } from '@etabli/contract'

import { requestAtelier } from '../lib/atelier-http'
import {
  DIRECTORY_RADIUS_KM,
  type AtelierDetail,
  type AtelierResult,
  type AtelierSummary,
  type DirectoryPoint,
  type MachineDetail,
} from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

export class AtelierHttpAdapter implements IAtelierPort {
  constructor(private readonly baseUrl: string) {}

  list(point: DirectoryPoint | null): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    const query =
      point === null
        ? undefined
        : {
            lat: String(point.latitude),
            lng: String(point.longitude),
            radiusKm: String(DIRECTORY_RADIUS_KM),
          }

    return requestAtelier<ReadonlyArray<AtelierSummary>>(this.baseUrl, routes.ateliers.list, { query })
  }

  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    return requestAtelier<AtelierDetail>(this.baseUrl, buildPath(routes.ateliers.getBySlug, { slug }))
  }

  getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    return requestAtelier<MachineDetail>(this.baseUrl, buildPath(routes.machines.getById, { id }))
  }
}
