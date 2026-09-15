import type { NetworkStats } from '@/modules/booking/core/model/manage-stats'
import { formatHours, formatRate } from '@/modules/booking/core/model/manage-stats'
import { Surface } from '@/ui/Surface'

export type NetworkStatsBoardProps = {
  readonly stats: NetworkStats
}

const Figure = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <Surface className="flex flex-col gap-1">
    <span className="font-display text-graphite-400 text-xs tracking-wider uppercase">{label}</span>
    <span className="font-display text-graphite-50 text-2xl font-bold">{value}</span>
  </Surface>
)

export const NetworkStatsBoard = ({ stats }: NetworkStatsBoardProps) => (
  <section className="flex flex-col gap-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Figure label="Ateliers mesurés" value={`${stats.ateliers}`} />
      <Figure label="Machines" value={`${stats.machines}`} />
      <Figure label="Occupation du réseau" value={formatRate(stats.occupancyRate)} />
      <Figure label="Heures consommées" value={formatHours(stats.consumedHours)} />
    </div>

    {stats.byAtelier.length === 0 ? (
      <p className="text-graphite-300">Aucun atelier du réseau ne tient encore de machine : rien à mesurer.</p>
    ) : (
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Occupation atelier par atelier</caption>
        <thead className="font-display text-graphite-400 text-xs tracking-wider uppercase">
          <tr className="border-graphite-800 border-b">
            <th scope="col" className="py-3 pr-4">
              Atelier
            </th>
            <th scope="col" className="py-3 pr-4">
              Occupation
            </th>
            <th scope="col" className="py-3 pr-4">
              Machines
            </th>
            <th scope="col" className="py-3 pr-4">
              Heures réservées
            </th>
            <th scope="col" className="py-3 pr-4">
              Heures consommées
            </th>
            <th scope="col" className="py-3">
              Non honorées
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.byAtelier.map((atelier) => (
            <tr key={atelier.atelierId} className="border-graphite-800/60 border-b">
              <th scope="row" className="font-display py-3 pr-4 text-left font-semibold tracking-wide">
                {atelier.atelierName}
              </th>
              <td className="text-graphite-100 py-3 pr-4">{formatRate(atelier.occupancyRate)}</td>
              <td className="text-graphite-300 py-3 pr-4">{atelier.machines.length}</td>
              <td className="text-graphite-300 py-3 pr-4">{formatHours(atelier.bookedHours)}</td>
              <td className="text-graphite-300 py-3 pr-4">{formatHours(atelier.consumedHours)}</td>
              <td className="text-graphite-300 py-3">{atelier.noShows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
)
