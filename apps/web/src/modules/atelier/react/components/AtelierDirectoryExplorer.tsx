'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import type { MapBounds } from '@/modules/atelier/core/lib/map-bounds'
import { visibleIn } from '@/modules/atelier/core/lib/map-bounds'
import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'

import { AtelierList } from './AtelierList'

const AtelierMap = dynamic(() => import('./AtelierMap').then((module) => module.AtelierMap), {
  ssr: false,
  loading: () => <div className="bg-graphite-900 h-full w-full animate-pulse" aria-hidden="true" />,
})

export type AtelierDirectoryExplorerProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
}

const countLabel = (visible: number, total: number): string =>
  visible === total
    ? `${total} atelier${total > 1 ? 's' : ''}`
    : `${visible} atelier${visible > 1 ? 's' : ''} sur ${total} dans la zone affichée`

export const AtelierDirectoryExplorer = ({ ateliers }: AtelierDirectoryExplorerProps) => {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const visible = visibleIn(ateliers, bounds)

  return (
    <div className="grid gap-6 lg:h-[calc(100dvh-8rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section aria-label="Liste des ateliers" className="flex min-h-0 flex-col gap-4">
        <p aria-live="polite" className="font-display text-graphite-400 text-sm tracking-wider uppercase">
          {countLabel(visible.length, ateliers.length)}
        </p>
        <div className="min-h-0 flex-1 lg:overflow-y-auto lg:pr-2">
          <AtelierList
            ateliers={visible}
            layout="stack"
            {...(ateliers.length === 0
              ? {}
              : {
                  emptyMessage: 'Aucun atelier dans cette zone. Dézoomez ou déplacez la carte pour en voir d’autres.',
                })}
          />
        </div>
      </section>

      <section
        aria-label="Carte des ateliers"
        className="border-graphite-800 order-first h-80 overflow-hidden rounded-sm border sm:h-[28rem] lg:order-none lg:h-full"
      >
        <AtelierMap ateliers={ateliers} onBoundsChange={setBounds} />
      </section>
    </div>
  )
}
