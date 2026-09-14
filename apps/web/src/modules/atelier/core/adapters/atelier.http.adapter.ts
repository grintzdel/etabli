import { buildPath, routes } from '@etabli/contract'

import type { AtelierDetail, AtelierResult, AtelierSummary, DirectoryFilters } from '../model/atelier'
import { AtelierFailureCode, failure } from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

const codeOf = (status: number): AtelierFailureCode => {
  if (status === 404) return AtelierFailureCode.NOT_FOUND
  if (status === 400) return AtelierFailureCode.INVALID_FILTER
  return AtelierFailureCode.UNREACHABLE
}

export class AtelierHttpAdapter implements IAtelierPort {
  constructor(private readonly baseUrl: string) {}

  private async call<A>(path: string): Promise<AtelierResult<A>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`)
    } catch {
      return failure(AtelierFailureCode.UNREACHABLE)
    }

    if (!response.ok) return failure(codeOf(response.status))

    try {
      return { ok: true, value: (await response.json()) as A }
    } catch {
      return failure(AtelierFailureCode.UNREACHABLE)
    }
  }

  list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    const query = new URLSearchParams()
    if (filters.city !== undefined) query.set('city', filters.city)
    if (filters.machineKind !== undefined) query.set('machineKind', filters.machineKind)
    const suffix = query.size === 0 ? '' : `?${query.toString()}`

    return this.call<ReadonlyArray<AtelierSummary>>(`${routes.ateliers.list}${suffix}`)
  }

  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    return this.call<AtelierDetail>(buildPath(routes.ateliers.getBySlug, { slug }))
  }
}
