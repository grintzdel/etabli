import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { buildOverview } from '@/modules/overview/core/model/overview'
import { OverviewBoard } from '@/modules/overview/react/components/OverviewBoard'
import { bookingPort, certificationPort, identityPort } from '@/server/container'
import { readSessionToken } from '@/server/session'

const PATH = '/tableau-de-bord'

export const metadata: Metadata = {
  title: 'Tableau de bord',
  robots: { index: false, follow: false },
}

const Board = async () => {
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=${PATH}`)

  const session = await identityPort.me(token)
  if (!session.ok) redirect(`/connexion?next=${PATH}`)

  const [bookings, certifications] = await Promise.all([bookingPort.list(token), certificationPort.mine(token)])

  if (!bookings.ok) {
    if (bookings.error.code === BookingFailureCode.UNAUTHORIZED) redirect(`/connexion?next=${PATH}`)
    return (
      <p role="alert" className="text-status-danger">
        {bookings.error.message}
      </p>
    )
  }

  const overview = buildOverview({
    bookings: bookings.value,
    certifications: certifications.ok ? certifications.value : [],
    atelierCount: session.value.memberships.length,
    now: new Date(),
  })

  return <OverviewBoard overview={overview} displayName={session.value.displayName} />
}

const BoardFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement de votre tableau de bord…
  </Surface>
)

export const DashboardPage = () => (
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-20">
    <Suspense fallback={<BoardFallback />}>
      <Board />
    </Suspense>
  </main>
)
