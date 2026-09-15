import { buildPath, routes } from '@etabli/contract'

import { requestIdentity } from '../lib/identity-http'
import type { AdminUser, AdminUsersQuery, UpdateAdminUser } from '../model/admin-user'
import type { IdentityResult } from '../model/session'
import type { IAdminUserPort } from '../ports/admin-user.port'

const queryString = (query: AdminUsersQuery): string => {
  const params = new URLSearchParams()
  if (query.search !== undefined) params.set('search', query.search)
  if (query.platformRole !== undefined) params.set('platformRole', query.platformRole)
  if (query.status !== undefined) params.set('status', query.status)
  const serialized = params.toString()
  return serialized.length === 0 ? '' : `?${serialized}`
}

export class AdminUserHttpAdapter implements IAdminUserPort {
  constructor(private readonly baseUrl: string) {}

  list(token: string, query: AdminUsersQuery): Promise<IdentityResult<ReadonlyArray<AdminUser>>> {
    return requestIdentity<ReadonlyArray<AdminUser>>(this.baseUrl, `${routes.admin.users}${queryString(query)}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })
  }

  update(token: string, id: string, patch: UpdateAdminUser): Promise<IdentityResult<AdminUser>> {
    return requestIdentity<AdminUser>(this.baseUrl, buildPath(routes.admin.user, { id }), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
  }
}
