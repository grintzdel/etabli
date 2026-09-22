import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

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
  private readonly anonymous: ApiClient<AtelierFailureCode>
  private readonly authenticated: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    const shared = { baseUrl, messages: FAILURE_MESSAGES, failureOf: atelierFailureOf }
    this.anonymous = createApiClient(shared)
    this.authenticated = createApiClient({ ...shared, getAuthToken, cache: 'no-store' })
  }

  list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    return this.anonymous.get<ReadonlyArray<AtelierSummary>>(routes.ateliers.list, {
      query: { city: filters.city, machineKind: filters.machineKind },
    })
  }

  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    return this.anonymous.get<AtelierDetail>(buildPath(routes.ateliers.getBySlug, { slug }))
  }

  getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    return this.anonymous.get<MachineDetail>(buildPath(routes.machines.getById, { id }))
  }

  completeOnboarding(input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>> {
    return this.authenticated.post<OnboardingResult>(routes.onboarding.complete, input)
  }
}
