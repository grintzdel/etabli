import { Surface } from '@etabli/ui'

import type { AtelierStats } from '@/modules/booking/core/model/manage-stats'
import { formatHours, formatRate } from '@/modules/booking/core/model/manage-stats'

export type AtelierStatsBoardProps = {
  readonly stats: ReadonlyArray<AtelierStats>
}

const Figure = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <Surface className="flex flex-col gap-1">
    <span className="font-display text-graphite-400 text-xs tracking-wider uppercase">{label}</span>
    <span className="font-display text-graphite-50 text-2xl font-bold">{value}</span>
  </Surface>
)

const AtelierBoard = ({ stats }: { readonly stats: AtelierStats }) => (
  <section className="flex flex-col gap-6">
    <h2 className="font-display text-2xl font-bold tracking-tight uppercase">{stats.atelierName}</h2>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Figure label="Occupation" value={formatRate(stats.occupancyRate)} />
      <Figure label="Heures d’ouverture" value={formatHours(stats.openHours)} />
      <Figure label="Heures réservées" value={formatHours(stats.bookedHours)} />
      <Figure label="Heures consommées" value={formatHours(stats.consumedHours)} />
      <Figure label="Non honorées" value={`${stats.noShows}`} />
    </div>

    {stats.machines.length === 0 ? (
      <p className="text-graphite-300">Aucune machine dans cet atelier : rien à mesurer.</p>
    ) : (
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Occupation machine par machine de {stats.atelierName}</caption>
        <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
          <tr className="border-graphite-800 border-b">
            <th scope="col" className="py-3 pr-4">
              Machine
            </th>
            <th scope="col" className="py-3 pr-4">
              Occupation
            </th>
            <th scope="col" className="py-3 pr-4">
              Heures réservées
            </th>
            <th scope="col" className="py-3 pr-4">
              Réservations
            </th>
            <th scope="col" className="py-3">
              Non honorées
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.machines.map((machine) => (
            <tr key={machine.machineId} className="border-graphite-800/60 border-b">
              <th scope="row" className="font-display py-3 pr-4 text-left font-semibold tracking-wide">
                {machine.machineName}
              </th>
              <td className="text-graphite-100 py-3 pr-4">{formatRate(machine.occupancyRate)}</td>
              <td className="text-graphite-300 py-3 pr-4">{formatHours(machine.bookedHours)}</td>
              <td className="text-graphite-300 py-3 pr-4">{machine.bookings}</td>
              <td className="text-graphite-300 py-3">{machine.noShows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
)

export const AtelierStatsBoard = ({ stats }: AtelierStatsBoardProps) => {
  if (stats.length === 0) {
    return <p className="text-graphite-300">Vous ne pilotez aucun atelier : il n’y a rien à mesurer ici.</p>
  }

  return (
    <div className="flex flex-col gap-12">
      {stats.map((atelier) => (
        <AtelierBoard key={atelier.atelierId} stats={atelier} />
      ))}
    </div>
  )
}
