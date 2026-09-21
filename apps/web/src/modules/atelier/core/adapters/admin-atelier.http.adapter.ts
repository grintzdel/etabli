import { buildPath, routes } from '@etabli/contract'
import { createApiClient, type ApiClient } from '@etabli/shared/http'

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

const failureOf = (status: number): AtelierFailureCode => {
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'SLUG_TAKEN'
  return 'UNREACHABLE'
}

export class AdminAtelierHttpAdapter implements IAdminAtelierPort {
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf, cache: 'no-store' })
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
