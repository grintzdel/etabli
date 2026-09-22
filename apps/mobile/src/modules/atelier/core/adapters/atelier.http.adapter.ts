import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { atelierFailureOf } from '../lib/atelier-failure'
import { directoryQuery } from '../lib/directory-query'
import {
  FAILURE_MESSAGES,
  type AtelierDetail,
  type AtelierFailureCode,
  type AtelierResult,
  type AtelierSummary,
  type CompleteOnboardingInput,
  type DirectoryFilters,
  type DirectoryPoint,
  type MachineDetail,
  type OnboardingResult,
} from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

export class AtelierHttpAdapter implements IAtelierPort {
  private readonly anonymous: ApiClient<AtelierFailureCode>
  private readonly authenticated: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    const shared = { baseUrl, messages: FAILURE_MESSAGES, failureOf: atelierFailureOf }
    this.anonymous = createApiClient(shared)
    this.authenticated = createApiClient({ ...shared, getAuthToken })
  }

  list(point: DirectoryPoint | null, filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    return this.anonymous.get<ReadonlyArray<AtelierSummary>>(routes.ateliers.list, {
      query: directoryQuery(point, filters),
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
