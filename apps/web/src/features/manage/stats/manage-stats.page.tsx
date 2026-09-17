import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { parseStatsPeriod } from '@/modules/booking/core/model/manage-stats'
import { AtelierStatsBoard } from '@/modules/booking/react/components/AtelierStatsBoard'
import { StatsPeriodFilter } from '@/modules/booking/react/components/StatsPeriodFilter'
import { manageBookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'

export const metadata: Metadata = {
  title: 'Statistiques · Gestion',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>

const Board = async ({ searchParams }: { readonly searchParams: SearchParams }) => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/manage/stats')

  const period = parseStatsPeriod(await searchParams)
  const result = await manageBookingPort.stats(token, { period })
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/stats')
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  return (
    <>
      <StatsPeriodFilter period={period} />
      <AtelierStatsBoard stats={result.value} />
    </>
  )
}

const BoardFallback = () => <Surface className="text-graphite-400">Mesure en cours…</Surface>

export const ManageStatsPage = ({ searchParams }: { readonly searchParams: SearchParams }) => (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Statistiques</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Ce que vos machines ont tenu sur la période, en journées entières d’ouverture. Les heures réservées comptent les
        créneaux qui tiennent encore la machine, no-shows compris ; les heures consommées ne comptent que les créneaux
        pointés et menés à leur terme.
      </p>
    </header>

    <Suspense fallback={<BoardFallback />}>
      <Board searchParams={searchParams} />
    </Suspense>
  </main>
)
