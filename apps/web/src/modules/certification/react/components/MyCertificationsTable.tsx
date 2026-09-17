import { Button, StatusBadge } from '@etabli/ui'

import type { MyCertification, MyCertificationStatus } from '@/modules/certification/core/model/certification'
import { isRequestable, MY_STATUS_LABELS } from '@/modules/certification/core/model/certification'

export type MyCertificationsTableProps = {
  readonly certifications: ReadonlyArray<MyCertification>
  readonly action: (formData: FormData) => void | Promise<void>
}

const TONES: Readonly<Record<MyCertificationStatus, 'ok' | 'warn' | 'danger' | 'neutral'>> = {
  GRANTED: 'ok',
  PENDING: 'warn',
  REVOKED: 'danger',
  NONE: 'neutral',
}

export const MyCertificationsTable = ({ certifications, action }: MyCertificationsTableProps) => {
  if (certifications.length === 0) {
    return (
      <output className="text-graphite-400">
        Aucune machine de vos ateliers ne demande d’habilitation pour l’instant.
      </output>
    )
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        <tr className="border-graphite-800 border-b">
          <th scope="col" className="py-3 pr-4">
            Machine
          </th>
          <th scope="col" className="py-3 pr-4">
            Atelier
          </th>
          <th scope="col" className="py-3 pr-4">
            Habilitation
          </th>
          <th scope="col" className="py-3">
            <span className="sr-only">Action</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {certifications.map((certification) => (
          <tr key={certification.machineId} className="border-graphite-800/60 border-b">
            <th scope="row" className="font-display py-3 pr-4 text-left font-semibold tracking-wide uppercase">
              {certification.machineName}
            </th>
            <td className="text-graphite-300 py-3 pr-4">{certification.atelierName}</td>
            <td className="py-3 pr-4">
              <StatusBadge tone={TONES[certification.status]} label={MY_STATUS_LABELS[certification.status]} />
            </td>
            <td className="py-3">
              {isRequestable(certification.status) ? (
                <form action={action}>
                  <input type="hidden" name="machineId" value={certification.machineId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    aria-label={`Demander une habilitation — ${certification.machineName}`}
                  >
                    Demander
                  </Button>
                </form>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
