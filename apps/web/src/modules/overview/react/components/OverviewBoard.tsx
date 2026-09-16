import Link from 'next/link'

import { formatDay, formatRange } from '@/modules/booking/core/lib/format'
import { STATUS_LABELS, STATUS_TONES } from '@/modules/booking/core/model/booking'
import type { Overview } from '@/modules/overview/core/model/overview'
import { buttonVariants } from '@/ui/Button'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

export type OverviewBoardProps = {
  readonly overview: Overview
  readonly displayName: string
}

const Metric = ({ label, value, href }: { readonly label: string; readonly value: number; readonly href: string }) => (
  <Link href={href} className="focus-visible:outline-signal-500 rounded-sm focus-visible:outline-2">
    <Surface className="hover:border-graphite-700 flex h-full flex-col gap-1 transition-colors">
      <span className="font-display text-signal-500 text-3xl font-bold">{value}</span>
      <span className="font-display text-graphite-300 text-xs tracking-wider uppercase">{label}</span>
    </Surface>
  </Link>
)

const NextBooking = ({ overview }: { readonly overview: Overview }) => {
  if (overview.nextBooking === null) {
    return (
      <Surface className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-graphite-200">
          {overview.atelierCount === 0
            ? 'Vous n’êtes membre d’aucun atelier : rien de prévu tant que vous n’en avez pas rejoint un.'
            : 'Rien de prévu. Choisissez une machine sur laquelle vous êtes habilité.'}
        </p>
        {overview.atelierCount === 0 ? (
          <Link href="/bienvenue" className={buttonVariants()}>
            Rejoindre un atelier
          </Link>
        ) : (
          <Link href="/ateliers" className={buttonVariants()}>
            Réserver une machine
          </Link>
        )}
      </Surface>
    )
  }

  const booking = overview.nextBooking

  return (
    <Surface className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/reservations/${booking.id}`}
            className="font-display hover:text-signal-500 text-2xl font-semibold tracking-wide uppercase"
          >
            {booking.machineName}
          </Link>
          <p className="text-graphite-300">{booking.atelierName}</p>
        </div>
        <StatusBadge tone={STATUS_TONES[booking.status]} label={STATUS_LABELS[booking.status]} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-graphite-300">{formatDay(booking.startAt)}</p>
        <p className="font-display text-xl">{formatRange(booking.startAt, booking.endAt)}</p>
      </div>

      {booking.canCheckIn ? (
        <p className="text-status-ok text-sm">
          Pointage ouvert : présentez le tag NFC posé sur le bâti pour prouver votre présence.
        </p>
      ) : null}
    </Surface>
  )
}

export const OverviewBoard = ({ overview, displayName }: OverviewBoardProps) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Bonjour {displayName}</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Ce que vous avez le droit d’utiliser, ce que vous avez réservé, ce qu’un fabmanager doit encore trancher.
      </p>
    </header>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Prochain créneau</h2>
      <NextBooking overview={overview} />
    </section>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">En un coup d’œil</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Créneaux à venir" value={overview.upcomingCount} href="/reservations" />
        <Metric label="Pointages ouverts" value={overview.checkInReadyCount} href="/reservations" />
        <Metric label="Habilitations" value={overview.grantedCount} href="/habilitations" />
        <Metric label="Ateliers" value={overview.atelierCount} href="/compte" />
      </div>
    </section>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Habilitations en attente</h2>
      {overview.pendingCertifications.length === 0 ? (
        <output className="text-graphite-400">
          Aucune demande en attente. Une demande se fait depuis la fiche d’une machine.
        </output>
      ) : (
        <ul className="flex flex-col gap-3">
          {overview.pendingCertifications.map((certification) => (
            <li key={certification.machineId}>
              <Surface className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col">
                  <Link
                    href={`/machines/${certification.machineId}`}
                    className="font-display hover:text-signal-500 font-semibold tracking-wide uppercase"
                  >
                    {certification.machineName}
                  </Link>
                  <span className="text-graphite-400 text-sm">{certification.atelierName}</span>
                </div>
                <StatusBadge tone="warn" label="En attente" />
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  </>
)
