import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { parseBookingDeskFilters, toAtelierBookingsQuery } from '@/modules/booking/core/model/manage-booking'
import { BookingDesk } from '@/modules/booking/react/components/BookingDesk'
import { BookingDeskFilters } from '@/modules/booking/react/components/BookingDeskFilters'
import { cancelAtelierBookingAction, manualCheckInAction, markNoShowAction } from '@/server/booking.actions'
import { manageBookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Pointage · Gestion',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>

const Desk = async ({ searchParams }: { readonly searchParams: SearchParams }) => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/manage/bookings')

  const filters = parseBookingDeskFilters(await searchParams, new Date())
  const result = await manageBookingPort.list(token, toAtelierBookingsQuery(filters))
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/bookings')
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  return (
    <>
      <BookingDeskFilters filters={filters} />
      <BookingDesk
        bookings={result.value}
        checkIn={manualCheckInAction}
        markNoShow={markNoShowAction}
        cancel={cancelAtelierBookingAction}
      />
    </>
  )
}

const DeskFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement de la journée…
  </Surface>
)

export const ManageBookingsPage = ({ searchParams }: { readonly searchParams: SearchParams }) => (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Pointage</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Les créneaux de vos ateliers, jour par jour. Quand le tag NFC refuse de se laisser lire, pointez le membre à la
        main : la fenêtre reste la même, quinze minutes avant le créneau et trente après son début. Une annulation par
        l’atelier reste possible tant que le créneau n’est pas terminé — le membre, lui, perd ce droit au départ.
      </p>
    </header>

    <Suspense fallback={<DeskFallback />}>
      <Desk searchParams={searchParams} />
    </Suspense>
  </main>
)
