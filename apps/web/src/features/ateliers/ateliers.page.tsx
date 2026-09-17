import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import { Suspense } from 'react'

import type { DirectoryFilters } from '@/modules/atelier/core/model/atelier'
import { parseDirectoryFilters } from '@/modules/atelier/core/model/atelier'
import { AtelierDirectoryFilters } from '@/modules/atelier/react/components/AtelierDirectoryFilters'
import { AtelierList } from '@/modules/atelier/react/components/AtelierList'
import { atelierPort } from '@/server/container'

export const metadata: Metadata = {
  title: 'Annuaire des ateliers',
  description:
    "Trouvez un atelier partagé près de chez vous, et le parc de machines qu'il publie : découpe laser, impression 3D, fraiseuse, tour à bois, couture, électronique.",
  alternates: { canonical: '/ateliers' },
  openGraph: {
    type: 'website',
    siteName: 'Établi',
    title: 'Annuaire des ateliers — Établi',
    description: "Les ateliers du réseau et le parc de machines qu'ils publient.",
  },
}

const loadDirectory = async (filters: DirectoryFilters) => {
  'use cache'
  cacheTag('ateliers')
  cacheLife('minutes')

  return atelierPort.list(filters)
}

type SearchParams = Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>

const Directory = async ({ searchParams }: { readonly searchParams: SearchParams }) => {
  const filters = parseDirectoryFilters(await searchParams)
  const result = await loadDirectory(filters)

  return (
    <>
      <AtelierDirectoryFilters filters={filters} />
      {result.ok ? (
        <AtelierList ateliers={result.value} />
      ) : (
        <p role="alert" className="text-status-danger">
          {result.error.message}
        </p>
      )}
    </>
  )
}

const DirectoryFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement de l’annuaire…
  </Surface>
)

export const AteliersPage = ({ searchParams }: { readonly searchParams: SearchParams }) => (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Les ateliers</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Chaque atelier publie son parc. L’habilitation, elle, se passe sur place et vaut pour un type de machine dans
        cet atelier-là.
      </p>
    </header>

    <Suspense fallback={<DirectoryFallback />}>
      <Directory searchParams={searchParams} />
    </Suspense>
  </main>
)
