import type { CertificationRequest, CertificationStatus } from '@/modules/certification/core/model/certification'
import { REQUEST_STATUS_LABELS } from '@/modules/certification/core/model/certification'
import { Button } from '@/ui/Button'
import { StatusBadge } from '@/ui/StatusBadge'

export type CertificationQueueProps = {
  readonly requests: ReadonlyArray<CertificationRequest>
  readonly grant: (formData: FormData) => void | Promise<void>
  readonly revoke: (formData: FormData) => void | Promise<void>
}

const TONES: Readonly<Record<CertificationStatus, 'ok' | 'warn' | 'danger'>> = {
  GRANTED: 'ok',
  PENDING: 'warn',
  REVOKED: 'danger',
}

export const CertificationQueue = ({ requests, grant, revoke }: CertificationQueueProps) => {
  if (requests.length === 0) {
    return <output className="text-graphite-400">Aucune demande d’habilitation sur vos ateliers.</output>
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        <tr className="border-graphite-800 border-b">
          <th scope="col" className="py-3 pr-4">
            Membre
          </th>
          <th scope="col" className="py-3 pr-4">
            Machine
          </th>
          <th scope="col" className="py-3 pr-4">
            Atelier
          </th>
          <th scope="col" className="py-3 pr-4">
            État
          </th>
          <th scope="col" className="py-3">
            <span className="sr-only">Décision</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id} className="border-graphite-800/60 border-b">
            <th scope="row" className="font-display py-3 pr-4 text-left font-semibold tracking-wide uppercase">
              {request.memberName}
            </th>
            <td className="text-graphite-300 py-3 pr-4">{request.machineName}</td>
            <td className="text-graphite-300 py-3 pr-4">{request.atelierName}</td>
            <td className="py-3 pr-4">
              <StatusBadge tone={TONES[request.status]} label={REQUEST_STATUS_LABELS[request.status]} />
            </td>
            <td className="py-3">
              <div className="flex flex-wrap gap-2">
                {request.status === 'GRANTED' ? null : (
                  <form action={grant}>
                    <input type="hidden" name="certificationId" value={request.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label={`Accorder — ${request.memberName} — ${request.machineName}`}
                    >
                      Accorder
                    </Button>
                  </form>
                )}
                {request.status === 'REVOKED' ? null : (
                  <form action={revoke}>
                    <input type="hidden" name="certificationId" value={request.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label={`Révoquer — ${request.memberName} — ${request.machineName}`}
                    >
                      Révoquer
                    </Button>
                  </form>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
