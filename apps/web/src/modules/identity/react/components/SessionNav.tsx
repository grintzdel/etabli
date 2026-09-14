import Link from 'next/link'

import { buttonVariants } from '@/ui/Button'

export type SessionNavProps = {
  readonly displayName: string
  readonly isPlatformAdmin: boolean
  readonly signOut: () => Promise<void>
}

export const SessionNav = ({ displayName, isPlatformAdmin, signOut }: SessionNavProps) => (
  <>
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
