import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import type { MachineDetail } from '@/modules/atelier/core/model/atelier'
import { MACHINE_KIND_LABELS, MACHINE_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'
import { MachineAccessNotice } from '@/modules/atelier/react/components/MachineAccessNotice'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { MachineWeek } from '@/modules/booking/react/components/MachineWeek'
import { createBookingAction } from '@/server/booking.actions'
import { atelierPort, bookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

type PageProps = { readonly params: Promise<{ readonly id: string }> }

const loadMachine = async (id: string) => {
  'use cache'
  cacheTag('ateliers', `machine-${id}`)
  cacheLife('minutes')

  return atelierPort.getMachineById(id)
}

// The fiche is the page: a machine out of the public parc must answer 404 before anything streams.
// Only the week below it depends on the reader, so only the week sits behind a boundary.
export const instant = false

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { id } = await params
  const result = await loadMachine(id)
  if (!result.ok) return { title: 'Machine introuvable', robots: { index: false, follow: false } }

  const machine = result.value
  const description = `${machine.name} — ${MACHINE_KIND_LABELS[machine.kind]} de ${machine.atelierName}. ${machine.description}`

  return {
    title: machine.name,
    description,
    alternates: { canonical: `/machines/${machine.id}` },
    openGraph: { type: 'website', siteName: 'Établi', title: `${machine.name} — Établi`, description },
  }
}

const Week = async ({ machine }: { readonly machine: MachineDetail }) => {
  const token = await readSessionToken()
  const result = token === null ? null : await bookingPort.availability(token, machine.id)

  if (result === null || (!result.ok && result.error.code === BookingFailureCode.MACHINE_NOT_BOOKABLE)) {
    return (
      <MachineAccessNotice
        signedIn={token !== null}
        atelierName={machine.atelierName}
        atelierSlug={machine.atelierSlug}
        machineId={machine.id}
      />
    )
  }

  if (!result.ok) {
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  return (
    <>
      {machine.requiresCertification ? (
        <Surface className="text-graphite-200 flex flex-wrap items-center justify-between gap-4">
          <p>Cette machine exige une habilitation. Sans elle, la réservation est refusée.</p>
          <Link href="/habilitations" className="text-signal-500 hover:text-signal-400 text-sm">
            Mes habilitations
          </Link>
        </Surface>
      ) : null}

      <Surface>
        <MachineWeek machineId={machine.id} initialAvailability={result.value} book={createBookingAction} />
      </Surface>
    </>
  )
}

const WeekFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des créneaux…
  </Surface>
)

export const MachinePage = async ({ params }: PageProps) => {
  const { id } = await params
  const result = await loadMachine(id)
  if (!result.ok) notFound()

  const machine = result.value

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
      <header className="flex flex-col gap-3">
        <nav aria-label="Fil d’Ariane">
          <Link href={`/ateliers/${machine.atelierSlug}`} className="text-graphite-400 hover:text-graphite-200 text-sm">
            ← {machine.atelierName}
          </Link>
        </nav>

        <h1 className="font-display text-4xl font-bold tracking-tight uppercase">{machine.name}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge
            tone={machine.status === 'AVAILABLE' ? 'ok' : 'warn'}
            label={MACHINE_STATUS_LABELS[machine.status]}
          />
          <span className="text-graphite-400 text-sm">{MACHINE_KIND_LABELS[machine.kind]}</span>
          <span className="text-graphite-400 text-sm">Créneaux de {machine.slotDurationMinutes} minutes</span>
          {machine.requiresCertification ? <StatusBadge tone="warn" label="Habilitation requise" /> : null}
        </div>

        {machine.description === '' ? null : <p className="text-graphite-200 max-w-2xl">{machine.description}</p>}
      </header>

      <Suspense fallback={<WeekFallback />}>
        <Week machine={machine} />
      </Suspense>
    </main>
  )
}
