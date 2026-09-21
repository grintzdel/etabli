import { createApiClient, type ApiClient } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import type { AdminUser, AdminUsersQuery, UpdateAdminUser } from '../model/admin-user'
import type { IdentityFailureCode, IdentityResult } from '../model/session'
import { FAILURE_MESSAGES } from '../model/session'
import type { IAdminUserPort } from '../ports/admin-user.port'

export class AdminUserHttpAdapter implements IAdminUserPort {
  private readonly http: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: identityFailureOf,
      cache: 'no-store',
    })
  }

  list(token: string, query: AdminUsersQuery): Promise<IdentityResult<ReadonlyArray<AdminUser>>> {
    return this.http.call<ReadonlyArray<AdminUser>>(routes.admin.users, {
      token,
      query: { search: query.search, platformRole: query.platformRole, status: query.status },
    })
  }

  update(token: string, id: string, patch: UpdateAdminUser): Promise<IdentityResult<AdminUser>> {
    return this.http.call<AdminUser>(buildPath(routes.admin.user, { id }), { method: 'PATCH', token, body: patch })
  }
}
