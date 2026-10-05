import { StatusBadge, Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import type { MachineDetail } from '@/modules/atelier/core/model/atelier'
import { MACHINE_KIND_LABELS, MACHINE_STATUS_LABELS } from '@/modules/atelier/core/model/atelier'
import type { BookingEligibility } from '@/modules/booking/core/model/booking'
import { bookingEligibilityOf } from '@/modules/booking/core/model/booking'
import { MachineWeek } from '@/modules/booking/react/components/MachineWeek'
import { createBookingAction } from '@/server/booking.actions'
import { requestCertificationAction } from '@/server/certification.actions'
import { atelierPort, bookingPort, certificationPort, identityPort } from '@/server/container'
import { hasSession } from '@/server/session'

type SearchParams = Promise<{ readonly creneau?: string }>
type PageProps = { readonly params: Promise<{ readonly id: string }>; readonly searchParams: SearchParams }

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

const eligibilityFor = async (machine: MachineDetail): Promise<BookingEligibility> => {
  if (!(await hasSession())) return bookingEligibilityOf(machine, null)

  const [user, certifications] = await Promise.all([
    identityPort.me(),
    machine.requiresCertification ? certificationPort.mine() : null,
  ])
  if (!user.ok) return bookingEligibilityOf(machine, null)

  return bookingEligibilityOf(machine, {
    memberships: user.value.memberships,
    certifications: certifications?.ok ? certifications.value : [],
  })
}

const Week = async ({
  machine,
  searchParams,
}: {
  readonly machine: MachineDetail
  readonly searchParams: SearchParams
}) => {
  const [result, eligibility, { creneau }] = await Promise.all([
    bookingPort.availability(machine.id),
    eligibilityFor(machine),
    searchParams,
  ])

  if (!result.ok) {
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  const preselected = result.value.slots.find((slot) => slot.available && slot.startAt === creneau)

  return (
    <Surface>
      <MachineWeek
        machineId={machine.id}
        atelierName={machine.atelierName}
        atelierSlug={machine.atelierSlug}
        eligibility={eligibility}
        initialAvailability={result.value}
        initialStartAt={preselected?.startAt ?? null}
        book={createBookingAction}
        requestCertification={requestCertificationAction}
      />
    </Surface>
  )
}

const WeekFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des créneaux…
  </Surface>
)

export const MachinePage = async ({ params, searchParams }: PageProps) => {
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
        <Week machine={machine} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
