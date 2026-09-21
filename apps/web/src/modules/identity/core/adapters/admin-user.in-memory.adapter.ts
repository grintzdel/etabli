import type { AdminUser, AdminUsersQuery, UpdateAdminUser } from '../model/admin-user'
import type { IdentityResult } from '../model/session'
import { failure, IdentityFailureCode } from '../model/session'
import type { IAdminUserPort } from '../ports/admin-user.port'

export class AdminUserInMemoryAdapter implements IAdminUserPort {
  private readonly users = new Map<string, AdminUser>()

  constructor(
    seed: ReadonlyArray<AdminUser> = [],
    private readonly admins: ReadonlySet<string> = new Set()
  ) {
    for (const user of seed) this.users.set(user.id, user)
  }

  async list(token: string, query: AdminUsersQuery): Promise<IdentityResult<ReadonlyArray<AdminUser>>> {
    if (!this.admins.has(token)) return failure(IdentityFailureCode.FORBIDDEN)
    return { ok: true, value: [...this.users.values()].filter((user) => this.matches(user, query)) }
  }

  private matches(user: AdminUser, query: AdminUsersQuery): boolean {
    const needle = query.search?.trim().toLowerCase()
    if (needle !== undefined && needle.length > 0) {
      const haystack = `${user.email} ${user.displayName}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    if (query.platformRole !== undefined && user.platformRole !== query.platformRole) return false
    return query.status === undefined || user.status === query.status
  }

  async update(token: string, id: string, patch: UpdateAdminUser): Promise<IdentityResult<AdminUser>> {
    if (!this.admins.has(token)) return failure(IdentityFailureCode.FORBIDDEN)

    const current = this.users.get(id)
    if (current === undefined) return failure(IdentityFailureCode.USER_UNKNOWN)
    if (id === token && (patch.platformRole === 'MEMBER' || patch.status === 'SUSPENDED')) {
      return failure(IdentityFailureCode.SELF_LOCKOUT)
    }

    const next: AdminUser = {
      ...current,
      platformRole: patch.platformRole ?? current.platformRole,
      status: patch.status ?? current.status,
    }
    this.users.set(id, next)
    return { ok: true, value: next }
  }
}
