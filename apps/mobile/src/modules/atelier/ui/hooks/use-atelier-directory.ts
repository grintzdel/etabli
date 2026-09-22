import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import { useCurrentPosition } from '../../../geo/ui/hooks/use-current-position'
import type { AtelierSummary, DirectoryFilters, MachineKind } from '../../core/model/atelier'

const NO_FILTER: DirectoryFilters = {}

export const useAtelierDirectory = () => {
  const position = useCurrentPosition()
  const point = position.point
  const [filters, setFilters] = useState<DirectoryFilters>(NO_FILTER)

  const query = usePublicQuery<ReadonlyArray<AtelierSummary>>(
    ['ateliers', point?.latitude ?? null, point?.longitude ?? null, filters.city ?? null, filters.machineKind ?? null],
    () => dependencies.atelier.list(point, filters),
    !position.isPending
  )

  return {
    ateliers: query.data ?? [],
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
      setFilters((previous) => ({ ...previous, city: trimmed === '' ? undefined : trimmed }))
    },
    toggleMachineKind: (kind: MachineKind) => {
      setFilters((previous) => ({ ...previous, machineKind: previous.machineKind === kind ? undefined : kind }))
    },
    clearFilters: () => setFilters(NO_FILTER),
  }
}
