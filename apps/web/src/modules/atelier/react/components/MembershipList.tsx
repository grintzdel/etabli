import { StatusBadge, Surface } from '@etabli/ui'
import Link from 'next/link'

import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'

export type MembershipView = {
  readonly atelierId: string
  readonly role: 'MEMBER' | 'FABMANAGER'
}

export type MembershipListProps = {
  readonly memberships: ReadonlyArray<MembershipView>
  readonly ateliers: ReadonlyArray<AtelierSummary>
}

const ROLE_LABELS: Readonly<Record<MembershipView['role'], string>> = {
  MEMBER: 'Membre',
  FABMANAGER: 'Fabmanager',
}

export const MembershipList = ({ memberships, ateliers }: MembershipListProps) => {
  if (memberships.length === 0) {
    return (
      <Surface className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-graphite-200">Vous n’êtes membre d’aucun atelier.</p>
        <Link href="/bienvenue" className="text-signal-500 underline">
          Rejoindre un atelier
        </Link>
      </Surface>
    )
  }

  return (
    <ul aria-label="Mes ateliers" className="flex flex-col gap-3">
      {memberships.map((membership) => {
        const atelier = ateliers.find((candidate) => candidate.id === membership.atelierId)

        return (
          <li key={membership.atelierId}>
            <Surface className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-display text-lg font-semibold tracking-wide uppercase">
                  {atelier === undefined ? 'Atelier' : atelier.name}
                </span>
                {atelier === undefined ? null : (
                  <span className="text-graphite-400 text-sm">
                    {atelier.city} · {atelier.machineCount} machine{atelier.machineCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  tone={membership.role === 'FABMANAGER' ? 'warn' : 'ok'}
                  label={ROLE_LABELS[membership.role]}
                />
                {atelier === undefined ? null : (
                  <Link href={`/ateliers/${atelier.slug}`} className="text-signal-500 text-sm underline">
                    Voir le parc
                  </Link>
                )}
              </div>
            </Surface>
          </li>
        )
      })}
    </ul>
  )
}
