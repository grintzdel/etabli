import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { BookingSummary } from '@/modules/booking/react/components/BookingSummary'
import { cancelBookingAction } from '@/server/booking.actions'
import { bookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Réservation',
  robots: { index: false, follow: false },
}

type PageProps = { readonly params: Promise<{ readonly id: string }> }

const Booking = async ({ params }: PageProps) => {
  const { id } = await params
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=/reservations/${id}`)

  const result = await bookingPort.getById(token, id)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect(`/connexion?next=/reservations/${id}`)
    if (result.error.code === BookingFailureCode.BOOKING_UNKNOWN) notFound()
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  return (
    <>
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">{result.value.machineName}</h1>

      <Surface>
        <BookingSummary booking={result.value} cancel={cancelBookingAction} />
      </Surface>
    </>
  )
}

const BookingFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement de la réservation…
  </Surface>
)

export const ReservationPage = ({ params }: PageProps) => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-20">
    <nav aria-label="Fil d’Ariane">
      <Link href="/reservations" className="text-graphite-400 hover:text-graphite-200 text-sm">
        ← Mes réservations
      </Link>
    </nav>

    <Suspense fallback={<BookingFallback />}>
      <Booking params={params} />
    </Suspense>
  </main>
)
