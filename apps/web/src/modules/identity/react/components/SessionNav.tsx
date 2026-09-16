import Link from 'next/link'

import { SidebarLink, SidebarSection } from '@/ui/AppSidebar'
import { buttonVariants } from '@/ui/Button'

export type DefaultAtelier = {
  readonly slug: string
  readonly name: string
}

export type SessionNavProps = {
  readonly displayName: string
  readonly isPlatformAdmin: boolean
  readonly isFabmanager: boolean
  readonly defaultAtelier: DefaultAtelier | null
  readonly signOut: () => Promise<void>
}

export const SessionNav = ({
  displayName,
  isPlatformAdmin,
  isFabmanager,
  defaultAtelier,
  signOut,
}: SessionNavProps) => (
  <>
    <SidebarSection title="Espace membre">
      <SidebarLink href="/tableau-de-bord">Tableau de bord</SidebarLink>
      <SidebarLink href="/reservations">Réservations</SidebarLink>
      <SidebarLink href="/habilitations">Habilitations</SidebarLink>
      <SidebarLink href="/ateliers">Annuaire</SidebarLink>
    </SidebarSection>

    {isFabmanager ? (
      <SidebarSection title="Atelier">
        <SidebarLink href="/manage/machines">Machines</SidebarLink>
        <SidebarLink href="/manage/certifications">File</SidebarLink>
        <SidebarLink href="/manage/bookings">Pointage</SidebarLink>
        <SidebarLink href="/manage/stats">Statistiques</SidebarLink>
      </SidebarSection>
    ) : null}

    {isPlatformAdmin ? (
      <SidebarSection title="Plateforme">
        <SidebarLink href="/admin/ateliers">Administration</SidebarLink>
        <SidebarLink href="/admin/utilisateurs">Utilisateurs</SidebarLink>
        <SidebarLink href="/admin/stats">Réseau</SidebarLink>
      </SidebarSection>
    ) : null}

    <div className="flex flex-col gap-2 lg:mt-auto">
      {defaultAtelier === null ? null : (
        <Link
          href={`/ateliers/${defaultAtelier.slug}`}
          className="font-display text-signal-500 hover:text-signal-400 text-sm"
        >
          {defaultAtelier.name}
        </Link>
      )}
      <div className="border-graphite-800 flex flex-wrap items-center gap-3 lg:flex-col lg:items-stretch lg:border-t lg:pt-4">
        <Link href="/parametres" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Paramètres
        </Link>
        <Link href="/compte" className="font-display text-graphite-200 hover:text-graphite-50 text-sm">
          {displayName}
        </Link>
        <form action={signOut}>
          <button type="submit" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  </>
)
