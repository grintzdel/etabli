import { buildPath, routes } from '@etabli/contract'
import { createApiClient, type ApiClient } from '@etabli/shared/http'

import { atelierFailureOf } from '../lib/atelier-failure'
import {
  DIRECTORY_RADIUS_KM,
  FAILURE_MESSAGES,
  type AtelierDetail,
  type AtelierFailureCode,
  type AtelierResult,
  type AtelierSummary,
  type DirectoryPoint,
  type MachineDetail,
} from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

export class AtelierHttpAdapter implements IAtelierPort {
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf: atelierFailureOf })
  }

  list(point: DirectoryPoint | null): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    return this.http.call<ReadonlyArray<AtelierSummary>>(routes.ateliers.list, {
      query:
        point === null
          ? undefined
          : {
              lat: String(point.latitude),
              lng: String(point.longitude),
              radiusKm: String(DIRECTORY_RADIUS_KM),
            },
    })
  }

  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    return this.http.call<AtelierDetail>(buildPath(routes.ateliers.getBySlug, { slug }))
  }

  getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    return this.http.call<MachineDetail>(buildPath(routes.machines.getById, { id }))
  }
}
