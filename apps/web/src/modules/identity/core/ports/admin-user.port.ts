import type { AdminUser, AdminUsersQuery, UpdateAdminUser } from '../model/admin-user'
import type { IdentityResult } from '../model/session'

export interface IAdminUserPort {
  list(query: AdminUsersQuery): Promise<IdentityResult<ReadonlyArray<AdminUser>>>
  update(id: string, patch: UpdateAdminUser): Promise<IdentityResult<AdminUser>>
}
