import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFailureCode, partitionBookings } from '@/modules/booking/core/model/booking'
import { BookingList } from '@/modules/booking/react/components/BookingList'
import { bookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { buttonVariants } from '@/ui/Button'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Mes réservations',
  robots: { index: false, follow: false },
}

const Bookings = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/reservations')

  const result = await bookingPort.list(token)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/reservations')
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  if (result.value.length === 0) {
    return (
      <Surface className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-graphite-200">
          Vous n’avez encore rien réservé. Choisissez un atelier, puis la machine dont vous avez besoin.
        </p>
        <Link href="/ateliers" className={buttonVariants()}>
          Voir les ateliers
        </Link>
      </Surface>
    )
  }

  const { upcoming, past } = partitionBookings(result.value, new Date())

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">À venir</h2>
        {upcoming.length === 0 ? (
          <p className="text-graphite-400">Aucun créneau devant vous.</p>
        ) : (
          <BookingList bookings={upcoming} caption="Réservations à venir" />
        )}
      </section>

      {past.length === 0 ? null : (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Passées</h2>
          <BookingList bookings={past} caption="Réservations passées" />
        </section>
      )}
    </div>
  )
}

const BookingsFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des réservations…
  </Surface>
)

export const ReservationsPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Mes réservations</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Un créneau s’annule tant qu’il n’a pas commencé. Passé son début, il reste inscrit — honoré ou non.
      </p>
    </header>

    <Suspense fallback={<BookingsFallback />}>
      <Bookings />
    </Suspense>
  </main>
)
