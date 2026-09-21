import { buildPath, routes } from '@etabli/contract'
import { createApiClient, errorCodeOf, type ApiClient } from '@etabli/shared/http'

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

const BY_CODE: Readonly<Record<string, AtelierFailureCode>> = {
  VALIDATION_FAILED: 'INVALID_FILTER',
  ATELIER_NOT_FOUND: 'NOT_FOUND',
  ATELIER_UNKNOWN: 'NOT_FOUND',
  MACHINE_UNKNOWN: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
}

const failureOf = (status: number, body: unknown): AtelierFailureCode => {
  const code = errorCodeOf(body)
  const mapped = code === undefined ? undefined : BY_CODE[code]
  if (mapped !== undefined) return mapped
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  return 'UNREACHABLE'
}

export class AtelierHttpAdapter implements IAtelierPort {
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf })
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
