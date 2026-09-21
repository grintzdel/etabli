import { buttonVariants } from '@etabli/ui/web'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
}

const NotFound = () => (
  <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-20">
    <p className="font-display text-signal-500 text-6xl font-bold">404</p>
    <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Cette page n’existe pas</h1>
    <p className="text-graphite-200">
      Le lien est peut-être périmé, ou l’atelier que vous cherchez n’est pas encore publié.
    </p>
    <div className="flex flex-wrap gap-4">
      <Link href="/ateliers" className={buttonVariants()}>
        Voir les ateliers
      </Link>
      <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
        Retour à l’accueil
      </Link>
    </div>
  </main>
)

export default NotFound
