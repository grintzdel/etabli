import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { atelierPhotoFor } from '@/modules/atelier/core/lib/machine-photo'
import { AtelierFailureCode } from '@/modules/atelier/core/model/atelier'
import { MachineTable } from '@/modules/atelier/react/components/MachineTable'
import { atelierPort } from '@/server/container'
import { buttonVariants } from '@/ui/Button'
import { PhotoHero } from '@/ui/PhotoHero'
import { Surface } from '@/ui/Surface'

type PageProps = { readonly params: Promise<{ readonly slug: string }> }

const loadAtelier = async (slug: string) => {
  'use cache'
  cacheTag('ateliers', `atelier-${slug}`)
  cacheLife('minutes')

  return atelierPort.getBySlug(slug)
}

// The whole page is the atelier: a missing one must answer 404 before anything streams, so there is
// no shell to prerender and a Suspense boundary would only delay the status code.
export const instant = false

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params
  const result = await loadAtelier(slug)
  if (!result.ok) return { title: 'Atelier introuvable', robots: { index: false, follow: false } }

  const atelier = result.value
  const description = `${atelier.name} — atelier partagé à ${atelier.city}. ${atelier.description}`

  return {
    title: atelier.name,
    description,
    alternates: { canonical: `/ateliers/${atelier.slug}` },
    openGraph: { type: 'website', siteName: 'Établi', title: `${atelier.name} — Établi`, description },
  }
}

export const AtelierPage = async ({ params }: PageProps) => {
  const { slug } = await params
  const result = await loadAtelier(slug)

  if (!result.ok) {
    if (result.error.code === AtelierFailureCode.NOT_FOUND) notFound()
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-20">
        <p role="alert" className="text-status-danger">
          {result.error.message}
        </p>
      </main>
    )
  }

  const atelier = result.value
  const kinds = [...new Set(atelier.machines.map((machine) => machine.kind))].toSorted()
  const photo = atelierPhotoFor(atelier.slug, kinds)

  const heading = (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">{atelier.name}</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">{atelier.description}</p>
    </div>
  )

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
      <nav aria-label="Fil d’Ariane">
        <Link href="/ateliers" className="text-graphite-400 hover:text-graphite-200 text-sm">
          ← Tous les ateliers
        </Link>
      </nav>

      <header>
        {photo === null ? (
          heading
        ) : (
          <PhotoHero src={photo} priority className="px-6 py-12 sm:px-10 sm:py-16">
            {heading}
          </PhotoHero>
        )}
      </header>

      <Surface className="flex flex-col gap-1">
        <h2 className="font-display text-graphite-400 text-xs tracking-wider uppercase">Adresse</h2>
        <address className="text-graphite-200 not-italic">
          {atelier.street}
          <br />
          {atelier.postalCode} {atelier.city}, {atelier.country}
        </address>
      </Surface>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Le parc</h2>
        <MachineTable machines={atelier.machines} />
      </section>

      <Surface className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-graphite-200">
          Une machine qui exige une habilitation refuse la réservation à qui ne l’a pas. Créez un compte pour demander
          la vôtre.
        </p>
        <Link href="/inscription" className={buttonVariants()}>
          Créer un compte
        </Link>
      </Surface>
    </main>
  )
}
