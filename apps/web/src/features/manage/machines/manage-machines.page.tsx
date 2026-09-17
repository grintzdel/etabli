import { StatusBadge, Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { AtelierFailureCode, ATELIER_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'
import { emptyMachineFormState } from '@/modules/atelier/core/model/machine-form'
import { MachineForm } from '@/modules/atelier/react/components/MachineForm'
import { ManagedParcTable } from '@/modules/atelier/react/components/ManagedParcTable'
import { manageMachinePort } from '@/server/container'
import { createMachineAction, setMachineNfcTagAction, setMachineStatusAction } from '@/server/manage.actions'
import { readSessionToken } from '@/server/session'

export const metadata: Metadata = {
  title: 'Machines · Gestion',
  robots: { index: false, follow: false },
}

const Parcs = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/manage/machines')

  const parcs = await manageMachinePort.listParcs(token)
  if (!parcs.ok) {
    if (parcs.error.code === AtelierFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/machines')
    return (
      <p role="alert" className="text-status-danger">
        {parcs.error.message}
      </p>
    )
  }

  if (parcs.value.length === 0) {
    return (
      <output className="text-graphite-400">
        Vous ne gérez le parc d’aucun atelier. Un fabmanager est désigné par l’atelier lui-même.
      </output>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      {parcs.value.map((parc) => (
        <section key={parc.atelier.id} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">{parc.atelier.name}</h2>
            <StatusBadge
              tone={parc.atelier.status === 'PUBLISHED' ? 'ok' : 'warn'}
              label={ATELIER_STATUS_LABELS[parc.atelier.status]}
            />
          </div>
          <ManagedParcTable
            machines={parc.machines}
            action={setMachineStatusAction}
            nfcTagAction={setMachineNfcTagAction}
          />
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Nouvelle machine</h2>
        <MachineForm
          action={createMachineAction}
          initialState={emptyMachineFormState}
          ateliers={parcs.value.map((parc) => ({ id: parc.atelier.id, name: parc.atelier.name }))}
        />
      </section>
    </div>
  )
}

const ParcsFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement du parc…
  </Surface>
)

export const ManageMachinesPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Machines</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Le parc des ateliers dont vous êtes fabmanager. Une machine retirée disparaît de la fiche publique ; une machine
        en maintenance y reste, signalée. Le tag NFC est ce qu’un membre présente pour pointer : il est unique sur tout
        le réseau, et le vider le décolle.
      </p>
    </header>

    <Suspense fallback={<ParcsFallback />}>
      <Parcs />
    </Suspense>
  </main>
)
