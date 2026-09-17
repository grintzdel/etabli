import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { AtelierFailureCode } from '@/modules/atelier/core/model/atelier'
import { emptyAtelierDraftFormState } from '@/modules/atelier/core/model/atelier-draft-form'
import { AdminAtelierTable } from '@/modules/atelier/react/components/AdminAtelierTable'
import { AtelierDraftForm } from '@/modules/atelier/react/components/AtelierDraftForm'
import { createAtelierAction, setAtelierStatusAction } from '@/server/admin.actions'
import { adminAtelierPort } from '@/server/container'
import { readSessionToken } from '@/server/session'

export const metadata: Metadata = {
  title: 'Ateliers · Administration',
  robots: { index: false, follow: false },
}

const Ateliers = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/admin/ateliers')

  const ateliers = await adminAtelierPort.list(token)
  if (!ateliers.ok) {
    if (ateliers.error.code === AtelierFailureCode.UNAUTHORIZED) redirect('/connexion?next=/admin/ateliers')
    return (
      <p role="alert" className="text-status-danger">
        {ateliers.error.message}
      </p>
    )
  }

  return <AdminAtelierTable ateliers={ateliers.value} action={setAtelierStatusAction} />
}

const AteliersFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des ateliers…
  </Surface>
)

export const AdminAteliersPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Ateliers</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Ouvrir un atelier, le publier dans l’annuaire, le refermer. Rien d’autre ne le fait entrer dans la carte
        publique.
      </p>
    </header>

    <Suspense fallback={<AteliersFallback />}>
      <Ateliers />
    </Suspense>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Nouvel atelier</h2>
      <AtelierDraftForm action={createAtelierAction} initialState={emptyAtelierDraftFormState} />
    </section>
  </main>
)
