import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { identityFailureOf } from '../lib/identity-failure'
import type { AdminUser, AdminUsersQuery, UpdateAdminUser } from '../model/admin-user'
import type { IdentityFailureCode, IdentityResult } from '../model/session'
import { FAILURE_MESSAGES } from '../model/session'
import type { IAdminUserPort } from '../ports/admin-user.port'

export class AdminUserHttpAdapter implements IAdminUserPort {
  private readonly authenticated: ApiClient<IdentityFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: identityFailureOf,
      getAuthToken,
      cache: 'no-store',
    })
  }

  list(query: AdminUsersQuery): Promise<IdentityResult<ReadonlyArray<AdminUser>>> {
    return this.authenticated.get<ReadonlyArray<AdminUser>>(routes.admin.users, {
      query: { search: query.search, platformRole: query.platformRole, status: query.status },
    })
  }

  update(id: string, patch: UpdateAdminUser): Promise<IdentityResult<AdminUser>> {
    return this.authenticated.patch<AdminUser>(buildPath(routes.admin.user, { id }), patch)
  }
}
