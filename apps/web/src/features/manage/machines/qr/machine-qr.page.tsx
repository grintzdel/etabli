import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { qrSvgDataUri } from '@/modules/atelier/core/lib/qr-code'
import { MACHINE_KIND_LABELS } from '@/modules/atelier/core/model/atelier'
import { QrCode } from '@/modules/atelier/react/components/QrCode'
import { manageMachinePort } from '@/server/container'
import { readSessionToken } from '@/server/session'

type PageProps = { readonly params: Promise<{ readonly id: string }> }

const QR_PATH = '/manage/machines'

// The sheet is printed by one fabmanager for one machine: there is no shell worth prerendering.
export const instant = false

export const metadata: Metadata = {
  title: 'QR de pointage',
  robots: { index: false, follow: false },
}

const loadMachine = async (id: string) => {
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=${QR_PATH}`)

  const parcs = await manageMachinePort.listParcs(token)
  if (!parcs.ok) notFound()

  for (const parc of parcs.value) {
    const machine = parc.machines.find((candidate) => candidate.id === id)
    if (machine !== undefined) return { machine, atelier: parc.atelier }
  }

  notFound()
}

export const MachineQrPage = async ({ params }: PageProps) => {
  const { id } = await params
  const { machine, atelier } = await loadMachine(id)

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-6 py-12">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight uppercase">{machine.name}</h1>
        <p className="text-lg">{MACHINE_KIND_LABELS[machine.kind]}</p>
        <p className="text-sm">{atelier.name}</p>
      </header>

      <QrCode source={qrSvgDataUri(machine.checkInToken)} label={`QR de pointage — ${machine.name}`} />

      <footer className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm">Collez ce QR sur la machine. Un membre le scanne pour prouver sa présence.</p>
        <p data-testid="check-in-token" className="font-mono text-xs break-all">
          {machine.checkInToken}
        </p>
        <a href={QR_PATH} className="text-sm underline print:hidden">
          Retour au parc
        </a>
      </footer>
    </main>
  )
}
