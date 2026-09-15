import Link from 'next/link'

import { buttonVariants } from '@/ui/Button'

export type SessionNavProps = {
  readonly displayName: string
  readonly isPlatformAdmin: boolean
  readonly isFabmanager: boolean
  readonly signOut: () => Promise<void>
}

export const SessionNav = ({ displayName, isPlatformAdmin, isFabmanager, signOut }: SessionNavProps) => (
  <>
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
      </>
    ) : null}
    {isPlatformAdmin ? (
      <Link href="/admin/ateliers" className="font-display text-graphite-300 hover:text-graphite-50 text-sm">
        Administration
      </Link>
    ) : null}
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
