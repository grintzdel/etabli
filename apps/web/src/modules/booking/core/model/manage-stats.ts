import type { AtelierStats, AtelierStatsQuery, MachineUsage, NetworkStats, StatsPeriod } from '@etabli/contract'

export type { AtelierStats, AtelierStatsQuery, MachineUsage, NetworkStats, StatsPeriod }

export const STATS_PERIODS: ReadonlyArray<StatsPeriod> = ['7d', '30d', '90d']

export const DEFAULT_STATS_PERIOD: StatsPeriod = '30d'

export const PERIOD_LABELS: Readonly<Record<StatsPeriod, string>> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
}

const isStatsPeriod = (value: string): value is StatsPeriod => STATS_PERIODS.some((period) => period === value)

export const parseStatsPeriod = (
  params: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>
): StatsPeriod => {
  const raw = params.period
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && isStatsPeriod(value) ? value : DEFAULT_STATS_PERIOD
}

export const formatHours = (hours: number): string => {
  const minutes = Math.round(hours * 60)
  const rest = minutes % 60
  return rest === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, '0')}`
}

export const formatRate = (rate: number): string => `${Math.round(rate * 100)} %`
