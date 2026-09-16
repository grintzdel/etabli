import Link from 'next/link'

export const SiteFooter = () => (
  <footer className="border-graphite-800 text-graphite-400 mt-16 border-t">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm">
      <p>Établi — réseau d’ateliers partagés. Projet fil rouge M2 EEMI.</p>
      <nav aria-label="Navigation de pied de page" className="flex flex-wrap gap-6">
        <Link href="/ateliers" className="hover:text-graphite-200">
          Annuaire
        </Link>
        <Link href="/fonctionnalites" className="hover:text-graphite-200">
          Fonctionnalités
        </Link>
        <Link href="/faq" className="hover:text-graphite-200">
          FAQ
        </Link>
        <Link href="/inscription" className="hover:text-graphite-200">
          Créer un compte
        </Link>
      </nav>
    </div>
  </footer>
)
