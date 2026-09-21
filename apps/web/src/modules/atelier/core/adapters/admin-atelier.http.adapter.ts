import { createApiClient, type ApiClient } from '@etabli/api-client'
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
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: adminAtelierFailureOf,
      cache: 'no-store',
    })
  }

  list(token: string): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>> {
    return this.http.call<ReadonlyArray<AdminAtelier>>(routes.admin.ateliers, { token })
  }

  create(token: string, input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>> {
    return this.http.call<AdminAtelier>(routes.admin.ateliers, { method: 'POST', token, body: input })
  }

  setStatus(token: string, id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>> {
    return this.http.call<AdminAtelier>(buildPath(routes.admin.atelier, { id }), {
      method: 'PATCH',
      token,
      body: input,
    })
  }

  setMembershipRole(
    token: string,
    atelierId: string,
    userId: string,
    input: SetMembershipRoleInput
  ): Promise<AtelierResult<AtelierMembership>> {
    return this.http.call<AtelierMembership>(buildPath(routes.admin.atelierMember, { atelierId, userId }), {
      method: 'PATCH',
      token,
      body: input,
    })
  }
}
