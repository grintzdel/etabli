import { StatusBadge, Surface } from '@etabli/ui'
import { buttonVariants } from '@etabli/ui/web'
import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

import { machinePhotoFor } from '@/modules/atelier/core/lib/machine-photo'
import { MACHINE_KIND_LABELS, MACHINE_KINDS } from '@/modules/atelier/core/model/atelier'
import { AtelierList } from '@/modules/atelier/react/components/AtelierList'
import { atelierPort } from '@/server/container'
import { PhotoHero } from '@/ui/PhotoHero'

export const metadata: Metadata = {
  title: 'Réservez la machine que vous avez le droit d’utiliser',
  description:
    "Établi relie l'habilitation, le créneau et la présence physique dans les ateliers partagés. Le système refuse une réservation sans habilitation, il n'alerte pas.",
  openGraph: {
    type: 'website',
    siteName: 'Établi',
    title: 'Établi — le réseau des ateliers partagés',
    description:
      "L'habilitation conditionne la réservation. Le créneau est exclusif. La présence est prouvée par QR code.",
  },
}

const FEATURED_ATELIERS = 3

const before = [
  {
    tool: 'Le groupe de messagerie',
    flaw: 'On y demande un créneau, quelqu’un répond « ok », et personne ne sait plus qui a dit oui à qui.',
  },
  {
    tool: 'Le tableur des habilitations',
    flaw: 'À jour le jour de sa création. Le fabmanager le consulte de mémoire, et dit non à la main.',
  },
  {
    tool: 'Le cahier près de la machine',
    flaw: 'On y signe quand on y pense. Le créneau réservé mais jamais honoré n’y laisse aucune trace.',
  },
]

const after = [
  'L’habilitation conditionne la réservation : le calendrier se ferme à qui ne l’a pas.',
  'Le créneau est exclusif, vérifié jusque dans la base de données.',
  'La présence est prouvée par le QR code collé sur la machine, et l’absence se constate.',
]

const steps = [
  {
    title: 'Passez votre habilitation',
    body: "Vous demandez l'accès à une machine de votre atelier. Le fabmanager accorde, ou non.",
  },
  {
    title: 'Réservez un créneau',
    body: 'Le calendrier ne vous propose que ce que vous avez le droit de prendre, et refuse tout chevauchement.',
  },
  {
    title: 'Pointez sur la machine',
    body: 'Le QR code collé sur le bâti prouve votre présence. Le check-in ne se fait pas depuis le canapé.',
  },
]

const roles = [
  {
    role: 'Membre',
    need: 'Savoir en trente secondes si la découpeuse laser est libre jeudi soir, et si on a le droit de la prendre.',
    gets: [
      'Les ateliers du réseau et leur parc',
      'Ses habilitations, machine par machine',
      'Ses créneaux, annulables jusqu’au départ',
    ],
  },
  {
    role: 'Fabmanager',
    need: 'Que le système dise non à sa place, et savoir qui était devant la machine à 19 h.',
    gets: [
      'La file des demandes d’habilitation',
      'Le pointage, le no-show et l’annulation du jour',
      'L’occupation réelle de chaque machine',
    ],
  },
  {
    role: 'Administration',
    need: 'Ouvrir un atelier, nommer qui le tient, suivre l’usage du réseau sans ouvrir un client SQL.',
    gets: [
      'La publication des ateliers',
      'Les comptes, les rôles et les suspensions',
      'Le tableau d’occupation du réseau',
    ],
  },
]

const mobile = [
  {
    title: 'Le QR code, scanné',
    body: 'L’application lit le code collé sur la machine et pointe le créneau. Sans caméra, le jeton se saisit à la main.',
  },
  {
    title: 'Les ateliers autour de vous',
    body: 'L’annuaire s’ouvre trié par distance, pas par ordre alphabétique. Refuser la position ne ferme rien.',
  },
  {
    title: 'Tout le parcours membre',
    body: 'Rejoindre un atelier, demander une habilitation, réserver, annuler : sans repasser par le navigateur.',
  },
]

const loadFeaturedAteliers = async () => {
  'use cache'
  cacheTag('ateliers')
  cacheLife('minutes')

  return atelierPort.list({})
}

const FeaturedAteliers = async () => {
  const result = await loadFeaturedAteliers()
  if (!result.ok || result.value.length === 0) return null

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Des ateliers du réseau</h2>
        <Link
          href="/ateliers"
          className="font-display text-signal-500 hover:text-signal-400 text-sm tracking-wide uppercase"
        >
          Tout l’annuaire
        </Link>
      </div>
      <AtelierList ateliers={result.value.slice(0, FEATURED_ATELIERS)} />
    </section>
  )
}

export const HomePage = () => (
  <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-20">
    <PhotoHero src="/marketing/hero-atelier.webp" priority className="px-6 py-14 sm:px-10 sm:py-20">
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
      </section>
    </PhotoHero>

    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Trois sources qui se contredisent</h2>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <ul aria-label="Les outils d’aujourd’hui" className="flex flex-col gap-4">
          {before.map((item) => (
            <li key={item.tool}>
              <Surface className="flex flex-col gap-2">
                <h3 className="font-display text-graphite-200 decoration-signal-500/70 text-lg font-semibold tracking-wide uppercase line-through">
                  {item.tool}
                </h3>
                <p className="text-graphite-400">{item.flaw}</p>
              </Surface>
            </li>
          ))}
        </ul>
        <Surface className="border-signal-500/40 flex flex-col gap-4">
          <h3 className="font-display text-signal-500 text-lg font-semibold tracking-wide uppercase">
            Une seule, avec Établi
          </h3>
          <ul className="text-graphite-200 flex flex-col gap-3">
            {after.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden="true" className="bg-signal-500 mt-2 size-2 shrink-0 rounded-full" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
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

    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Les machines du réseau</h2>
        <p className="text-graphite-400 max-w-2xl">
          Six familles de machines, publiées par les ateliers eux-mêmes. Choisissez-en une, l’annuaire vous dit qui l’a.
        </p>
      </div>
      <ul aria-label="Types de machines du réseau" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {MACHINE_KINDS.map((kind) => (
          <li key={kind}>
            <Link
              href={`/ateliers?machineKind=${kind}`}
              className="group border-graphite-800 hover:border-signal-500 focus-visible:outline-signal-500 relative isolate flex aspect-[4/3] items-end overflow-hidden rounded-sm border p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Image
                src={machinePhotoFor(kind)}
                alt=""
                width={1600}
                height={1067}
                sizes="(min-width: 640px) 20rem, 45vw"
                className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="from-graphite-950 via-graphite-950/60 absolute inset-0 -z-10 bg-gradient-to-t to-transparent" />
              <span className="font-display text-base font-semibold tracking-wide uppercase sm:text-lg">
                {MACHINE_KIND_LABELS[kind]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>

    <Suspense>
      <FeaturedAteliers />
    </Suspense>

    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Pour qui</h2>
      <ul aria-label="Les trois rôles" className="grid gap-4 md:grid-cols-3">
        {roles.map((item) => (
          <li key={item.role}>
            <Surface className="flex h-full flex-col gap-4">
              <StatusBadge tone="neutral" label={item.role} className="self-start" />
              <p className="text-graphite-200">{item.need}</p>
              <ul className="text-graphite-400 mt-auto flex flex-col gap-2 text-sm">
                {item.gets.map((line) => (
                  <li key={line} className="border-graphite-800 border-t pt-2">
                    {line}
                  </li>
                ))}
              </ul>
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
    </section>

    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">
          Dans la poche, devant la machine
        </h2>
        <p className="text-graphite-400 max-w-2xl">
          L’application mobile existe pour deux choses que le navigateur fait mal : la caméra et la position.
        </p>
      </div>
      <ul aria-label="L’application mobile" className="grid gap-4 sm:grid-cols-3">
        {mobile.map((item) => (
          <li key={item.title}>
            <Surface className="flex h-full flex-col gap-3">
              <h3 className="font-display text-lg font-semibold tracking-wide uppercase">{item.title}</h3>
              <p className="text-graphite-400">{item.body}</p>
            </Surface>
          </li>
        ))}
      </ul>
    </section>

    <Surface className="border-signal-500/40 flex flex-col items-start gap-6 px-6 py-10 sm:px-10">
      <h2 className="font-display text-3xl font-bold tracking-tight uppercase">Votre atelier est peut-être déjà là</h2>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Créez un compte, rejoignez un atelier du réseau, et demandez votre première habilitation.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/inscription" className={buttonVariants()}>
          Créer un compte
        </Link>
        <Link href="/faq" className={buttonVariants({ variant: 'ghost' })}>
          Les questions qu'on nous pose
        </Link>
      </div>
    </Surface>
  </main>
)
