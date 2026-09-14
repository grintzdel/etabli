import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'

import { AtelierCard } from './AtelierCard'

export type AtelierListProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
}

export const AtelierList = ({ ateliers }: AtelierListProps) => {
  if (ateliers.length === 0) {
    return <output className="text-graphite-400">Aucun atelier ne correspond à ces critères.</output>
  }

  return (
    <ul aria-label="Ateliers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ateliers.map((atelier) => (
        <li key={atelier.id}>
          <AtelierCard atelier={atelier} />
        </li>
      ))}
    </ul>
  )
}
