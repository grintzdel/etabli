import Link from 'next/link'

import type { MachineStatus, PublicMachine } from '@/modules/atelier/core/model/atelier'
import { MACHINE_KIND_LABELS, MACHINE_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'
import { StatusBadge } from '@/ui/StatusBadge'

export type MachineTableProps = {
  readonly machines: ReadonlyArray<PublicMachine>
}

const TONES: Readonly<Record<MachineStatus, 'ok' | 'warn' | 'neutral'>> = {
  AVAILABLE: 'ok',
  MAINTENANCE: 'warn',
  RETIRED: 'neutral',
}

const cellClassName = 'border-graphite-800 border-t px-4 py-3 align-top'

export const MachineTable = ({ machines }: MachineTableProps) => {
  if (machines.length === 0) {
    return <p className="text-graphite-400">Cet atelier n’a pas encore publié son parc.</p>
  }

  return (
    <div className="border-graphite-800 overflow-x-auto rounded-sm border">
      <table className="w-full min-w-2xl border-collapse text-left">
        <caption className="sr-only">Parc de machines de l’atelier</caption>
        <thead>
          <tr className="font-display text-graphite-400 text-xs tracking-wider uppercase">
            <th scope="col" className="px-4 py-3">
              Machine
            </th>
            <th scope="col" className="px-4 py-3">
              Type
            </th>
            <th scope="col" className="px-4 py-3">
              Créneau
            </th>
            <th scope="col" className="px-4 py-3">
              Habilitation
            </th>
            <th scope="col" className="px-4 py-3">
              État
            </th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => (
            <tr key={machine.id}>
              <th scope="row" className={`${cellClassName} font-semibold`}>
                {machine.status === 'RETIRED' ? (
                  machine.name
                ) : (
                  <Link href={`/machines/${machine.id}`} className="hover:text-signal-500">
                    {machine.name}
                  </Link>
                )}
                <span className="text-graphite-400 block text-sm font-normal">{machine.description}</span>
              </th>
              <td className={cellClassName}>{MACHINE_KIND_LABELS[machine.kind]}</td>
              <td className={cellClassName}>{machine.slotDurationMinutes} min</td>
              <td className={cellClassName}>
                {machine.requiresCertification ? (
                  <StatusBadge tone="warn" label="Requise" />
                ) : (
                  <StatusBadge tone="ok" label="Libre" />
                )}
              </td>
              <td className={cellClassName}>
                <StatusBadge tone={TONES[machine.status]} label={MACHINE_STATUS_LABELS[machine.status]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
