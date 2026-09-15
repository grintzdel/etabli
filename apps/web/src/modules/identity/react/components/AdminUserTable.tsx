import type { AdminUser } from '@/modules/identity/core/model/admin-user'
import {
  ADMIN_USERS_LIMIT,
  MEMBERSHIP_ROLE_LABELS,
  PLATFORM_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONES,
} from '@/modules/identity/core/model/admin-user'
import type { SettingsFormAction } from '@/modules/identity/core/model/settings'
import { StatusBadge } from '@/ui/StatusBadge'

import { AdminUserRowAction } from './AdminUserRowAction'

export type AdminUserTableProps = {
  readonly users: ReadonlyArray<AdminUser>
  readonly action: SettingsFormAction
  readonly membershipAction: SettingsFormAction
}

const signedUp = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'medium' })

export const AdminUserTable = ({ users, action, membershipAction }: AdminUserTableProps) => {
  if (users.length === 0) {
    return <p className="text-graphite-300">Aucun compte ne répond à ces filtres.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Comptes de la plateforme</caption>
        <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
          <tr className="border-graphite-800 border-b">
            <th scope="col" className="py-3 pr-4">
              Compte
            </th>
            <th scope="col" className="py-3 pr-4">
              Inscrit le
            </th>
            <th scope="col" className="py-3 pr-4">
              Rôle
            </th>
            <th scope="col" className="py-3 pr-4">
              Ateliers
            </th>
            <th scope="col" className="py-3 pr-4">
              État
            </th>
            <th scope="col" className="py-3">
              Agir
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} id={user.id} className="border-graphite-800/60 border-b align-top">
              <th scope="row" className="py-3 pr-4 text-left">
                <span className="font-display block font-semibold tracking-wide">{user.displayName}</span>
                <span className="text-graphite-400 block font-normal">{user.email}</span>
              </th>
              <td className="text-graphite-300 py-3 pr-4">{signedUp.format(new Date(user.createdAt))}</td>
              <td className="text-graphite-100 py-3 pr-4">{PLATFORM_ROLE_LABELS[user.platformRole]}</td>
              <td className="py-3 pr-4">
                {user.ateliers.length === 0 ? (
                  <span className="text-graphite-500">Aucun</span>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {user.ateliers.map((atelier) => (
                      <li key={atelier.id} className="flex flex-col gap-1">
                        <span className="text-graphite-100">
                          {atelier.name} · {MEMBERSHIP_ROLE_LABELS[atelier.role]}
                        </span>
                        <AdminUserRowAction
                          userId={user.id}
                          atelierId={atelier.id}
                          role={atelier.role === 'FABMANAGER' ? 'MEMBER' : 'FABMANAGER'}
                          label={
                            atelier.role === 'FABMANAGER'
                              ? `Retirer la gestion de ${atelier.name}`
                              : `Nommer fabmanager de ${atelier.name}`
                          }
                          pendingLabel="Changement…"
                          variant="ghost"
                          action={membershipAction}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge tone={USER_STATUS_TONES[user.status]} label={USER_STATUS_LABELS[user.status]} />
              </td>
              <td className="flex flex-col gap-3 py-3">
                {user.platformRole === 'PLATFORM_ADMIN' ? (
                  <AdminUserRowAction
                    userId={user.id}
                    label="Retirer l’administration"
                    pendingLabel="Retrait…"
                    variant="ghost"
                    platformRole="MEMBER"
                    action={action}
                  />
                ) : (
                  <AdminUserRowAction
                    userId={user.id}
                    label="Nommer administrateur"
                    pendingLabel="Nomination…"
                    variant="ghost"
                    platformRole="PLATFORM_ADMIN"
                    action={action}
                  />
                )}
                {user.status === 'SUSPENDED' ? (
                  <AdminUserRowAction
                    userId={user.id}
                    label="Réactiver"
                    pendingLabel="Réactivation…"
                    status="ACTIVE"
                    action={action}
                  />
                ) : (
                  <AdminUserRowAction
                    userId={user.id}
                    label="Suspendre"
                    pendingLabel="Suspension…"
                    variant="danger"
                    status="SUSPENDED"
                    action={action}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === ADMIN_USERS_LIMIT ? (
        <p className="text-graphite-400 text-sm">
          Les {ADMIN_USERS_LIMIT} comptes les plus récents. Affinez la recherche pour voir les autres.
        </p>
      ) : null}
    </div>
  )
}
