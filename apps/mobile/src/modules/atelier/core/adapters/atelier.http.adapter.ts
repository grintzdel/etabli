import { createApiClient, type ApiClient } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

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
  private readonly anonymous: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.anonymous = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf: atelierFailureOf })
  }

  list(point: DirectoryPoint | null): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    return this.anonymous.get<ReadonlyArray<AtelierSummary>>(routes.ateliers.list, {
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
    return this.anonymous.get<AtelierDetail>(buildPath(routes.ateliers.getBySlug, { slug }))
  }

  getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    return this.anonymous.get<MachineDetail>(buildPath(routes.machines.getById, { id }))
  }
}
