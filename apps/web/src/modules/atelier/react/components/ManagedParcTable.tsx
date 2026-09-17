import { Button, StatusBadge } from '@etabli/ui'

import type { MachineStatus, ManagedMachine } from '@/modules/atelier/core/model/atelier'
import { MACHINE_KIND_LABELS, MACHINE_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'
import type { NfcTagFormAction } from '@/modules/atelier/core/model/nfc-tag-form'

import { MachineNfcTagForm } from './MachineNfcTagForm'

export type ManagedParcTableProps = {
  readonly machines: ReadonlyArray<ManagedMachine>
  readonly action: (formData: FormData) => void | Promise<void>
  readonly nfcTagAction: NfcTagFormAction
}

const TONES: Readonly<Record<MachineStatus, 'ok' | 'warn' | 'neutral'>> = {
  AVAILABLE: 'ok',
  MAINTENANCE: 'warn',
  RETIRED: 'neutral',
}

const NEXT: Readonly<Record<MachineStatus, ReadonlyArray<{ readonly status: MachineStatus; readonly label: string }>>> =
  {
    AVAILABLE: [
      { status: 'MAINTENANCE', label: 'En maintenance' },
      { status: 'RETIRED', label: 'Retirer' },
    ],
    MAINTENANCE: [
      { status: 'AVAILABLE', label: 'Remettre en service' },
      { status: 'RETIRED', label: 'Retirer' },
    ],
    RETIRED: [{ status: 'AVAILABLE', label: 'Remettre en service' }],
  }

export const ManagedParcTable = ({ machines, action, nfcTagAction }: ManagedParcTableProps) => {
  if (machines.length === 0) {
    return <output className="text-graphite-400">Aucune machine dans cet atelier pour l’instant.</output>
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        <tr className="border-graphite-800 border-b">
          <th scope="col" className="py-3 pr-4">
            Machine
          </th>
          <th scope="col" className="py-3 pr-4">
            Créneau
          </th>
          <th scope="col" className="py-3 pr-4">
            Habilitation
          </th>
          <th scope="col" className="py-3 pr-4">
            État
          </th>
          <th scope="col" className="py-3 pr-4">
            Tag NFC
          </th>
          <th scope="col" className="py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {machines.map((machine) => (
          <tr key={machine.id} className="border-graphite-800/60 border-b align-top">
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <span className="font-display font-semibold tracking-wide uppercase">{machine.name}</span>
              <span className="text-graphite-500 block">{MACHINE_KIND_LABELS[machine.kind]}</span>
            </th>
            <td className="text-graphite-300 py-3 pr-4">{machine.slotDurationMinutes} min</td>
            <td className="text-graphite-300 py-3 pr-4">{machine.requiresCertification ? 'Requise' : 'Libre'}</td>
            <td className="py-3 pr-4">
              <StatusBadge tone={TONES[machine.status]} label={MACHINE_STATUS_LABELS[machine.status]} />
            </td>
            <td className="py-3 pr-4">
              <MachineNfcTagForm
                machineId={machine.id}
                machineName={machine.name}
                nfcTagId={machine.nfcTagId}
                action={nfcTagAction}
              />
            </td>
            <td className="py-3">
              <div className="flex flex-wrap gap-2">
                {NEXT[machine.status].map((transition) => (
                  <form key={transition.status} action={action}>
                    <input type="hidden" name="machineId" value={machine.id} />
                    <input type="hidden" name="status" value={transition.status} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label={`${transition.label} — ${machine.name}`}
                    >
                      {transition.label}
                    </Button>
                  </form>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
