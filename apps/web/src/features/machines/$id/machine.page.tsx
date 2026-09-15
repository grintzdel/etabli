import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { MACHINE_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { MachineWeek } from '@/modules/booking/react/components/MachineWeek'
import { createBookingAction } from '@/server/booking.actions'
import { bookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Réserver une machine',
  robots: { index: false, follow: false },
}

type PageProps = { readonly params: Promise<{ readonly id: string }> }

const Availability = async ({ params }: PageProps) => {
  const { id } = await params
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=/machines/${id}`)

  const result = await bookingPort.availability(token, id)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect(`/connexion?next=/machines/${id}`)
    if (result.error.code === BookingFailureCode.MACHINE_NOT_BOOKABLE) notFound()
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  const availability = result.value

  return (
    <>
      <header className="flex flex-col gap-3">
        <nav aria-label="Fil d’Ariane">
          <Link
            href={`/ateliers/${availability.atelierSlug}`}
            className="text-graphite-400 hover:text-graphite-200 text-sm"
          >
            ← {availability.atelierName}
          </Link>
        </nav>

        <h1 className="font-display text-4xl font-bold tracking-tight uppercase">{availability.machineName}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge
            tone={availability.machineStatus === 'AVAILABLE' ? 'ok' : 'warn'}
            label={MACHINE_STATUS_LABELS[availability.machineStatus]}
          />
          <span className="text-graphite-400 text-sm">Créneaux de {availability.slotDurationMinutes} minutes</span>
        </div>
      </header>

      {availability.requiresCertification ? (
        <Surface className="text-graphite-200 flex flex-wrap items-center justify-between gap-4">
          <p>Cette machine exige une habilitation. Sans elle, la réservation est refusée.</p>
          <Link href="/habilitations" className="text-signal-500 hover:text-signal-400 text-sm">
            Mes habilitations
          </Link>
        </Surface>
      ) : null}

      <Surface>
        <MachineWeek machineId={id} initialAvailability={availability} book={createBookingAction} />
      </Surface>
    </>
  )
}

const AvailabilityFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des créneaux…
  </Surface>
)

export const MachinePage = ({ params }: PageProps) => (
  <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
    <Suspense fallback={<AvailabilityFallback />}>
      <Availability params={params} />
    </Suspense>
  </main>
)
