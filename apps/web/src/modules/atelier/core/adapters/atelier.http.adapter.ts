import { buildPath, routes } from '@etabli/contract'

import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryFilters,
  MachineDetail,
  OnboardingResult,
} from '../model/atelier'
import { AtelierFailureCode, failure } from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

const codeOf = (status: number): AtelierFailureCode => {
  if (status === 404) return AtelierFailureCode.NOT_FOUND
  if (status === 400) return AtelierFailureCode.INVALID_FILTER
  if (status === 401 || status === 403) return AtelierFailureCode.UNAUTHORIZED
  return AtelierFailureCode.UNREACHABLE
}

export class AtelierHttpAdapter implements IAtelierPort {
  constructor(private readonly baseUrl: string) {}

  private async call<A>(path: string, init?: RequestInit): Promise<AtelierResult<A>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, init)
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

  getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    return this.call<MachineDetail>(buildPath(routes.machines.getById, { id }))
  }

  completeOnboarding(token: string, input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>> {
    return this.call<OnboardingResult>(routes.onboarding.complete, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
      cache: 'no-store',
    })
  }
}
