import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { CertificationFailureCode } from '@/modules/certification/core/model/certification'
import { CertificationQueue } from '@/modules/certification/react/components/CertificationQueue'
import { grantCertificationAction, revokeCertificationAction } from '@/server/certification.actions'
import { certificationPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Habilitations · Gestion',
  robots: { index: false, follow: false },
}

const Queue = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/manage/certifications')

  const queue = await certificationPort.queue(token)
  if (!queue.ok) {
    if (queue.error.code === CertificationFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/certifications')
    return (
      <p role="alert" className="text-status-danger">
        {queue.error.message}
      </p>
    )
  }

  return (
    <CertificationQueue requests={queue.value} grant={grantCertificationAction} revoke={revokeCertificationAction} />
  )
}

const QueueFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement de la file…
  </Surface>
)

export const ManageCertificationsPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Habilitations</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Les demandes en attente d’abord. Accorder ouvre la machine au membre ; révoquer la lui referme, y compris après
        coup.
      </p>
    </header>

    <Suspense fallback={<QueueFallback />}>
      <Queue />
    </Suspense>
  </main>
)
