import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import { useCurrentPosition } from '../../../geo/ui/hooks/use-current-position'
import { visibleIn, type MapBounds } from '../../core/lib/map-region'
import type { AtelierSummary, DirectoryFilters, MachineKind } from '../../core/model/atelier'

const NO_FILTER: DirectoryFilters = {}

export const useAtelierDirectory = () => {
  const position = useCurrentPosition()
  const point = position.point
  const [filters, setFilters] = useState<DirectoryFilters>(NO_FILTER)
  const [bounds, setBounds] = useState<MapBounds | null>(null)

  const query = usePublicQuery<ReadonlyArray<AtelierSummary>>(
    ['ateliers', point?.latitude ?? null, point?.longitude ?? null, filters.city ?? null, filters.machineKind ?? null],
    () => dependencies.atelier.list(point, filters),
    !position.isPending
  )

  const ateliers = query.data ?? []
  const changeFilters = (update: (previous: DirectoryFilters) => DirectoryFilters) => {
    const next = update(filters)
    if (next.city === filters.city && next.machineKind === filters.machineKind) return

    setBounds(null)
    setFilters(next)
  }

  return {
    ateliers,
    visibleAteliers: visibleIn(ateliers, bounds),
    onBoundsChange: setBounds,
    hasPosition: point !== null,
    isPending: position.isPending || query.isPending,
    error: query.error?.message ?? null,
    locationNotice: position.notice,
    retryLocation: position.retry,
    refresh: () => void query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
    filters,
    hasFilters: filters.city !== undefined || filters.machineKind !== undefined,
    searchCity: (city: string) => {
      const trimmed = city.trim()
      changeFilters((previous) => ({ ...previous, city: trimmed === '' ? undefined : trimmed }))
    },
    toggleMachineKind: (kind: MachineKind) => {
      changeFilters((previous) => ({ ...previous, machineKind: previous.machineKind === kind ? undefined : kind }))
    },
    clearFilters: () => changeFilters(() => NO_FILTER),
  }
}
