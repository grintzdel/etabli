import Link from 'next/link'

import { buttonVariants } from '@/ui/Button'

export type SessionNavProps = {
  readonly displayName: string
  readonly signOut: () => Promise<void>
}

export const SessionNav = ({ displayName, signOut }: SessionNavProps) => (
  <>
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
