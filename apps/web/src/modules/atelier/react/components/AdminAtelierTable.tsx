import { Button, StatusBadge } from '@etabli/ui'

import type { AdminAtelier, AtelierStatus } from '@/modules/atelier/core/model/atelier'
import { ATELIER_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'

export type AdminAtelierTableProps = {
  readonly ateliers: ReadonlyArray<AdminAtelier>
  readonly action: (formData: FormData) => void | Promise<void>
}

const TONES: Readonly<Record<AtelierStatus, 'ok' | 'warn' | 'neutral'>> = {
  PUBLISHED: 'ok',
  DRAFT: 'warn',
  CLOSED: 'neutral',
}

const NEXT: Readonly<Record<AtelierStatus, { readonly status: AtelierStatus; readonly label: string }>> = {
  DRAFT: { status: 'PUBLISHED', label: 'Publier' },
  PUBLISHED: { status: 'CLOSED', label: 'Fermer' },
  CLOSED: { status: 'PUBLISHED', label: 'Rouvrir' },
}

export const AdminAtelierTable = ({ ateliers, action }: AdminAtelierTableProps) => {
  if (ateliers.length === 0) {
    return <output className="text-graphite-400">Aucun atelier pour l’instant.</output>
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        <tr className="border-graphite-800 border-b">
          <th scope="col" className="py-3 pr-4">
            Atelier
          </th>
          <th scope="col" className="py-3 pr-4">
            Ville
          </th>
          <th scope="col" className="py-3 pr-4">
            Machines
          </th>
          <th scope="col" className="py-3 pr-4">
            État
          </th>
          <th scope="col" className="py-3">
            <span className="sr-only">Action</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {ateliers.map((atelier) => (
          <tr key={atelier.id} className="border-graphite-800/60 border-b">
            <td className="py-3 pr-4">
              <span className="font-display font-semibold tracking-wide uppercase">{atelier.name}</span>
              <span className="text-graphite-500 block">/{atelier.slug}</span>
            </td>
            <td className="text-graphite-300 py-3 pr-4">{atelier.city}</td>
            <td className="text-graphite-300 py-3 pr-4">{atelier.machineCount}</td>
            <td className="py-3 pr-4">
              <StatusBadge tone={TONES[atelier.status]} label={ATELIER_STATUS_LABELS[atelier.status]} />
            </td>
            <td className="py-3">
              <form action={action}>
                <input type="hidden" name="atelierId" value={atelier.id} />
                <input type="hidden" name="status" value={NEXT[atelier.status].status} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  aria-label={`${NEXT[atelier.status].label} ${atelier.name}`}
                >
                  {NEXT[atelier.status].label}
                </Button>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
