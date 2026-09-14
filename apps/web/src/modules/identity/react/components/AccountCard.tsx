import type { CurrentUser } from '@/modules/identity/core/model/session'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

const ROLE_LABELS: Readonly<Record<CurrentUser['platformRole'], string>> = {
  MEMBER: 'Membre',
  PLATFORM_ADMIN: 'Administrateur de la plateforme',
}

export const AccountCard = ({ user }: { readonly user: CurrentUser }) => (
  <Surface className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">{user.displayName}</h2>
      <StatusBadge tone="neutral" label={ROLE_LABELS[user.platformRole]} />
    </div>
    <dl className="text-graphite-200 grid gap-2 sm:grid-cols-[12rem_1fr]">
      <dt className="text-graphite-400">Adresse e-mail</dt>
      <dd>{user.email}</dd>
      <dt className="text-graphite-400">Compte créé le</dt>
      <dd>
        <time dateTime={user.createdAt}>
          {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(
            new Date(user.createdAt)
          )}
        </time>
      </dd>
    </dl>
  </Surface>
)
