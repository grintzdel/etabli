import Link from 'next/link'

import { buttonVariants } from './Button'

export type SiteHeaderProps = {
  readonly session: React.ReactNode
}

const linkClassName = 'font-display text-graphite-300 hover:text-graphite-50 text-sm tracking-wide uppercase'

export const SiteHeader = ({ session }: SiteHeaderProps) => (
  <header className="border-graphite-800 bg-graphite-950/80 sticky top-0 z-10 border-b backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
      <Link href="/" className="font-display text-signal-500 text-xl font-bold tracking-widest uppercase">
        Établi
      </Link>

      <nav aria-label="Navigation principale" className="flex items-center gap-6">
        <Link href="/ateliers" className={linkClassName}>
          Ateliers
        </Link>
        <Link href="/compte" className={linkClassName}>
          Mon compte
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-3">{session}</div>
    </div>
  </header>
)

export const SignedOutLinks = () => (
  <>
    <Link href="/connexion" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
      Se connecter
    </Link>
    <Link href="/inscription" className={buttonVariants({ size: 'sm' })}>
      Créer un compte
    </Link>
  </>
)
