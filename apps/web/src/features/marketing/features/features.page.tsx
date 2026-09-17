import { Surface } from '@etabli/ui'
import { buttonVariants } from '@etabli/ui/web'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PhotoHero } from '@/ui/PhotoHero'

export const metadata: Metadata = {
  title: 'Fonctionnalités',
  description:
    "Habilitation machine, réservation exclusive, pointage NFC, back-office fabmanager et tableau réseau : ce qu'Établi tient à la place du groupe de messagerie et du cahier posé près de la machine.",
  alternates: { canonical: '/fonctionnalites' },
  openGraph: {
    type: 'website',
    siteName: 'Établi',
    title: 'Fonctionnalités — Établi',
    description: "L'habilitation conditionne la réservation. Le créneau est exclusif. La présence est prouvée.",
  },
}

const capabilities = [
  {
    title: 'Habilitation par machine',
    body: "Rejoindre un atelier n'habilite à rien. Chaque machine se demande, et c'est un fabmanager de cet atelier qui accorde ou refuse. Une habilitation révoquée ferme le calendrier le jour même.",
  },
  {
    title: 'Réservation exclusive',
    body: 'Deux créneaux ne peuvent jamais se chevaucher sur une machine. La règle est tenue par une contrainte d’exclusion en base, pas seulement par le code qui la précède.',
  },
  {
    title: 'Pointage NFC',
    body: 'Le tag collé sur le bâti prouve la présence. Le pointage ouvre 15 minutes avant le créneau et ferme 30 minutes après son début ; passé cette fenêtre, l’absence est acquise.',
  },
  {
    title: 'Back-office fabmanager',
    body: 'La file des demandes d’habilitation, le parc de machines, le pointage de secours, le no-show et l’annulation de la journée — pour ses ateliers, et pour eux seuls.',
  },
  {
    title: 'Administration du réseau',
    body: 'Ouvrir un atelier, le publier dans l’annuaire, le refermer. Nommer un fabmanager, suspendre un compte. Un administrateur ne peut ni se retirer son rôle ni se suspendre.',
  },
  {
    title: 'Occupation mesurée',
    body: 'Heures réservées, heures réellement consommées, no-shows et taux d’occupation, par machine et par atelier. Un créneau annulé rend la machine et ne compte aucune heure.',
  },
]

export const FeaturesPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-20">
    <PhotoHero src="/marketing/hero-reseau.webp" priority className="px-6 py-14 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-6">
        <h1 className="font-display text-4xl leading-tight font-bold tracking-tight uppercase sm:text-5xl">
          Ce qu’Établi tient à votre place
        </h1>
        <p className="text-graphite-200 max-w-2xl text-lg">
          Un atelier partagé se gère aujourd’hui avec un groupe de messagerie, un tableur et un cahier près de la
          machine. Les trois se contredisent. Établi n’en garde qu’une source.
        </p>
      </header>
    </PhotoHero>

    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Le produit, point par point</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {capabilities.map((capability) => (
          <li key={capability.title}>
            <Surface className="flex h-full flex-col gap-3">
              <h3 className="font-display text-lg font-semibold tracking-wide uppercase">{capability.title}</h3>
              <p className="text-graphite-400">{capability.body}</p>
            </Surface>
          </li>
        ))}
      </ul>
    </section>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Bientôt, sur le téléphone</h2>
      <Surface className="text-graphite-200 flex flex-col gap-3">
        <p>
          Le pointage se fait déjà par tag NFC : l’application mobile lira le tag directement, là où le navigateur ne
          sait pas le faire.
        </p>
        <p>
          Chaque atelier porte ses coordonnées : l’annuaire mobile ouvrira sur les ateliers autour de vous, et non sur
          une liste alphabétique.
        </p>
      </Surface>
    </section>

    <section className="flex flex-wrap items-center gap-4">
      <Link href="/ateliers" className={buttonVariants()}>
        Voir les ateliers
      </Link>
      <Link href="/faq" className={buttonVariants({ variant: 'ghost' })}>
        Questions fréquentes
      </Link>
    </section>
  </main>
)
