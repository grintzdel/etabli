import type { AdminUsersQuery } from '@/modules/identity/core/model/admin-user'
import {
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLES,
  USER_STATUS_LABELS,
  USER_STATUSES,
} from '@/modules/identity/core/model/admin-user'
import { buttonVariants } from '@/ui/Button'

export type AdminUserFiltersProps = {
  readonly query: AdminUsersQuery
}

const fieldClassName =
  'border-graphite-700 bg-graphite-950 text-graphite-50 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none'

export const AdminUserFilters = ({ query }: AdminUserFiltersProps) => (
  <form method="get" aria-label="Filtrer les comptes" className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5">
      <label htmlFor="search" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        Nom ou adresse
      </label>
      <input
        id="search"
        name="search"
        type="search"
        defaultValue={query.search ?? ''}
        className={fieldClassName}
        placeholder="camille"
      />
    </div>

    <div className="flex flex-col gap-1.5">
      <label htmlFor="platformRole" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        Rôle
      </label>
      <select id="platformRole" name="platformRole" defaultValue={query.platformRole ?? ''} className={fieldClassName}>
        <option value="">Tous</option>
        {PLATFORM_ROLES.map((role) => (
          <option key={role} value={role}>
            {PLATFORM_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1.5">
      <label htmlFor="status" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        État
      </label>
      <select id="status" name="status" defaultValue={query.status ?? ''} className={fieldClassName}>
        <option value="">Tous</option>
        {USER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {USER_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>

    <button type="submit" className={buttonVariants()}>
      Filtrer
    </button>
  </form>
)
