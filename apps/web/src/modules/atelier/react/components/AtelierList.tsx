import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'

import { AtelierCard } from './AtelierCard'

export type AtelierListProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
  readonly layout?: 'grid' | 'stack'
  readonly emptyMessage?: string
}

const LAYOUT_CLASS_NAMES = {
  grid: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  stack: 'flex flex-col gap-4',
} as const

export const AtelierList = ({
  ateliers,
  layout = 'grid',
  emptyMessage = 'Aucun atelier ne correspond à ces critères.',
}: AtelierListProps) => {
  if (ateliers.length === 0) {
    return <output className="text-graphite-400">{emptyMessage}</output>
  }

  return (
    <ul aria-label="Ateliers" className={LAYOUT_CLASS_NAMES[layout]}>
      {ateliers.map((atelier) => (
        <li key={atelier.id}>
          <AtelierCard atelier={atelier} />
        </li>
      ))}
    </ul>
  )
}
