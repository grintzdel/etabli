import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { CertificationFailureCode } from '@/modules/certification/core/model/certification'
import { MyCertificationsTable } from '@/modules/certification/react/components/MyCertificationsTable'
import { requestCertificationAction } from '@/server/certification.actions'
import { certificationPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Mes habilitations',
  robots: { index: false, follow: false },
}

const Certifications = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/habilitations')

  const mine = await certificationPort.mine(token)
  if (!mine.ok) {
    if (mine.error.code === CertificationFailureCode.UNAUTHORIZED) redirect('/connexion?next=/habilitations')
    return (
      <p role="alert" className="text-status-danger">
        {mine.error.message}
      </p>
    )
  }

  return <MyCertificationsTable certifications={mine.value} action={requestCertificationAction} />
}

const CertificationsFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des habilitations…
  </Surface>
)

export const HabilitationsPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Mes habilitations</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Rejoindre un atelier ne vous habilite à rien. Chaque machine se demande, et c’est un fabmanager qui accorde.
      </p>
    </header>

    <Suspense fallback={<CertificationsFallback />}>
      <Certifications />
    </Suspense>
  </main>
)
