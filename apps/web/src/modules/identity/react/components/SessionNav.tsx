import Link from 'next/link'

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
    {defaultAtelier === null ? null : (
      <Link
        href={`/ateliers/${defaultAtelier.slug}`}
        className="font-display text-signal-500 hover:text-signal-400 text-sm"
      >
        {defaultAtelier.name}
      </Link>
    )}
    <Link href="/tableau-de-bord" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
      Tableau de bord
    </Link>
    <Link href="/reservations" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
      Réservations
    </Link>
    <Link href="/habilitations" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
      Habilitations
    </Link>
    {isFabmanager ? (
      <>
        <Link href="/manage/machines" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Machines
        </Link>
        <Link href="/manage/certifications" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          File
        </Link>
        <Link href="/manage/bookings" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Pointage
        </Link>
        <Link href="/manage/stats" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Statistiques
        </Link>
      </>
    ) : null}
    {isPlatformAdmin ? (
      <>
        <Link href="/admin/ateliers" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Administration
        </Link>
        <Link href="/admin/utilisateurs" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Utilisateurs
        </Link>
        <Link href="/admin/stats" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
          Réseau
        </Link>
      </>
    ) : null}
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
  </>
)
