import { buildPath, routes } from '@etabli/contract'
import { createApiClient, type ApiClient } from '@etabli/shared/http'

import { atelierFailureOf } from '../lib/atelier-failure'
import type {
  AtelierDetail,
  AtelierFailureCode,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryFilters,
  MachineDetail,
  OnboardingResult,
} from '../model/atelier'
import { FAILURE_MESSAGES } from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

export class AtelierHttpAdapter implements IAtelierPort {
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf: atelierFailureOf })
  }

  list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    return this.http.call<ReadonlyArray<AtelierSummary>>(routes.ateliers.list, {
      query: { city: filters.city, machineKind: filters.machineKind },
    })
  }

  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    return this.http.call<AtelierDetail>(buildPath(routes.ateliers.getBySlug, { slug }))
  }

  getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    return this.http.call<MachineDetail>(buildPath(routes.machines.getById, { id }))
  }

  completeOnboarding(token: string, input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>> {
    return this.http.call<OnboardingResult>(routes.onboarding.complete, {
      method: 'POST',
      token,
      body: input,
      cache: 'no-store',
    })
  }
}
