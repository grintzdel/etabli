import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { buttonVariants } from '@/ui/Button'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Réservez la machine que vous avez le droit d’utiliser',
  description:
    "Établi relie l'habilitation, le créneau et la présence physique dans les ateliers partagés. Le système refuse une réservation sans habilitation, il n'alerte pas.",
  openGraph: {
    type: 'website',
    siteName: 'Établi',
    title: 'Établi — le réseau des ateliers partagés',
    description: "L'habilitation conditionne la réservation. Le créneau est exclusif. La présence est prouvée par NFC.",
  },
}

const steps = [
  {
    title: 'Passez votre habilitation',
    body: "Vous demandez l'accès à un type de machine dans votre atelier. Le fabmanager accorde, ou non.",
  },
  {
    title: 'Réservez un créneau',
    body: 'Le calendrier ne vous propose que ce que vous avez le droit de prendre, et refuse tout chevauchement.',
  },
  {
    title: 'Pointez sur la machine',
    body: 'Le tag NFC collé sur le bâti prouve votre présence. Le check-in ne se fait pas depuis le canapé.',
  },
]

export const HomePage = () => (
  <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-20">
    <section className="flex flex-col gap-6">
      <StatusBadge tone="warn" label="Réseau d'ateliers partagés" className="self-start" />
      <h1 className="font-display text-4xl leading-tight font-bold tracking-tight uppercase sm:text-6xl">
        On ne réserve pas une découpeuse laser parce qu'elle est libre. On la réserve parce qu'on a le droit de s'en
        servir.
      </h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Établi relie l'habilitation, le créneau et la présence physique. Une seule source de vérité, à la place du
        groupe de messagerie, du tableur et du cahier posé près de la machine.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/ateliers" className={buttonVariants()}>
          Découvrir les ateliers
        </Link>
        <Link href="/fonctionnalites" className={buttonVariants({ variant: 'ghost' })}>
          Voir les fonctionnalités
        </Link>
      </div>

      <Image
        src="/ateliers/cover-2.png"
        alt=""
        width={1200}
        height={800}
        priority
        sizes="(min-width: 1024px) 64rem, 90vw"
        className="border-graphite-800 h-56 w-full rounded-sm border object-cover sm:h-80"
      />
    </section>

    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Comment ça marche</h2>
      <ul aria-label="Fonctionnement en trois temps" className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Surface className="flex h-full flex-col gap-3">
              <span className="font-display text-signal-500 text-3xl font-bold">{`0${index + 1}`}</span>
              <h3 className="font-display text-lg font-semibold tracking-wide uppercase">{step.title}</h3>
              <p className="text-graphite-400">{step.body}</p>
            </Surface>
          </li>
        ))}
      </ul>
    </section>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Ce que le système garantit</h2>
      <Surface className="text-graphite-200 flex flex-col gap-3">
        <p>Une machine qui exige une habilitation refuse la réservation à qui ne l'a pas.</p>
        <p>Deux réservations ne peuvent jamais se chevaucher sur la même machine.</p>
        <p>Un fabmanager n'agit que dans son atelier, vérifié côté serveur et non par un bouton masqué.</p>
      </Surface>
      <Link href="/faq" className="font-display text-signal-500 hover:text-signal-400 text-sm tracking-wide uppercase">
        Les questions qu'on nous pose
      </Link>
    </section>
  </main>
)
