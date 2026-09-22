import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { adminAtelierFailureOf } from '../lib/atelier-failure'
import type {
  AdminAtelier,
  AtelierFailureCode,
  AtelierMembership,
  AtelierResult,
  CreateAtelierInput,
  SetAtelierStatusInput,
  SetMembershipRoleInput,
} from '../model/atelier'
import { FAILURE_MESSAGES } from '../model/atelier'
import type { IAdminAtelierPort } from '../ports/admin-atelier.port'

export class AdminAtelierHttpAdapter implements IAdminAtelierPort {
  private readonly authenticated: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: adminAtelierFailureOf,
      getAuthToken,
      cache: 'no-store',
    })
  }

  list(): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>> {
    return this.authenticated.get<ReadonlyArray<AdminAtelier>>(routes.admin.ateliers)
  }

  create(input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>> {
    return this.authenticated.post<AdminAtelier>(routes.admin.ateliers, input)
  }

  setStatus(id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>> {
    return this.authenticated.patch<AdminAtelier>(buildPath(routes.admin.atelier, { id }), input)
  }

  setMembershipRole(
    atelierId: string,
    userId: string,
    input: SetMembershipRoleInput
  ): Promise<AtelierResult<AtelierMembership>> {
    return this.authenticated.patch<AtelierMembership>(
      buildPath(routes.admin.atelierMember, { atelierId, userId }),
      input
    )
  }
}
