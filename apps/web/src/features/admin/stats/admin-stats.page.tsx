import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFailureCode } from '@/modules/booking/core/model/booking'
import { parseStatsPeriod } from '@/modules/booking/core/model/manage-stats'
import { NetworkStatsBoard } from '@/modules/booking/react/components/NetworkStatsBoard'
import { StatsPeriodFilter } from '@/modules/booking/react/components/StatsPeriodFilter'
import { manageBookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'

export const metadata: Metadata = {
  title: 'Statistiques réseau · Administration',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>

const Board = async ({ searchParams }: { readonly searchParams: SearchParams }) => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/admin/stats')

  const period = parseStatsPeriod(await searchParams)
  const result = await manageBookingPort.networkStats(token, { period })
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/admin/stats')
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  return (
    <>
      <StatsPeriodFilter period={period} />
      <NetworkStatsBoard stats={result.value} />
    </>
  )
}

const BoardFallback = () => <Surface className="text-graphite-400">Mesure du réseau…</Surface>

export const AdminStatsPage = ({ searchParams }: { readonly searchParams: SearchParams }) => (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Statistiques réseau</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Le réseau entier sur la période, atelier par atelier, du plus occupé au moins occupé. Les mêmes règles que le
        tableau d’un fabmanager : un créneau annulé ne compte aucune heure, un no-show en compte, et une machine retirée
        sort des deux côtés du ratio.
      </p>
    </header>

    <Suspense fallback={<BoardFallback />}>
      <Board searchParams={searchParams} />
    </Suspense>
  </main>
)
